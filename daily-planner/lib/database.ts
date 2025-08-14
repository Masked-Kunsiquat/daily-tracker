import * as SQLite from 'expo-sqlite';

export interface DailyEntry {
  id?: number;
  date: string;
  daily_text: string;
  accomplishments: string[];
  things_learned: string[];
  things_grateful: string[];
  ratings: {
    productivity: number;
    mood: number;
    energy: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Summary {
  id?: number;
  type: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  content: string;
  insights: {
    key_themes: string[];
    productivity_trend: number;
    mood_trend: number;
    energy_trend: number;
    top_accomplishments: string[];
    main_learnings: string[];
  };
  created_at?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    // Return early if already initialized to make this idempotent
    if (this.db && this.isInitialized) {
      return;
    }

    this.db = await SQLite.openDatabaseAsync('daily_planner.db');
    // Enable foreign key enforcement (for ON DELETE CASCADE) and use WAL for concurrency
    await this.db.execAsync('PRAGMA foreign_keys = ON');
    await this.db.execAsync('PRAGMA journal_mode = WAL');
    // Only proceed to create tables after ensuring PRAGMAs applied successfully
    await this.createTables();
    this.isInitialized = true;
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Daily entries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        daily_text TEXT,
        productivity_rating INTEGER,
        mood_rating INTEGER,
        energy_rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // New table for accomplishments, learnings, and gratitude
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_entry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY(entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE
      );
    `);

    // Summaries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        content TEXT NOT NULL,
        insights TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
      CREATE INDEX IF NOT EXISTS idx_daily_entry_items_entry_id ON daily_entry_items(entry_id);
      CREATE INDEX IF NOT EXISTS idx_summaries_type_date ON summaries(type, start_date, end_date);
    `);
  }

  async saveDailyEntry(entry: DailyEntry): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    // Insert or update the daily entry atomically (UPSERT by date to avoid race conditions)
    await this.db.runAsync(`
      INSERT INTO daily_entries (date, daily_text, productivity_rating, mood_rating, energy_rating, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(date) DO UPDATE SET
        daily_text = excluded.daily_text,
        productivity_rating = excluded.productivity_rating,
        mood_rating = excluded.mood_rating,
        energy_rating = excluded.energy_rating,
        updated_at = CURRENT_TIMESTAMP
    `, [
      entry.date,
      entry.daily_text,
      entry.ratings.productivity,
      entry.ratings.mood,
      entry.ratings.energy
    ]);
    // Retrieve the entry ID for the inserted or updated entry
    const row = await this.db.getFirstAsync(
      'SELECT id FROM daily_entries WHERE date = ?',
      [entry.date]
    );
    const entryId = (row as any)?.id;

    if (entryId) {
      // Save all list items for this entry in a single transaction (replacing old items)
      await this.saveItemsBatch(entryId, [
        ...entry.accomplishments.filter(item => item.trim()).map(item => ({ type: 'accomplishment', content: item })),
        ...entry.things_learned.filter(item => item.trim()).map(item => ({ type: 'learning', content: item })),
        ...entry.things_grateful.filter(item => item.trim()).map(item => ({ type: 'grateful', content: item }))
      ]);
    }

    return entryId;
  }

  private async saveItemsBatch(entryId: number, items: { type: string; content: string }[]): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.execAsync('BEGIN TRANSACTION');
      // Delete any existing items for this entry
      await this.db.runAsync('DELETE FROM daily_entry_items WHERE entry_id = ?', [entryId]);

      // Insert all new items for this entry
      if (items.length > 0) {
        // Prepare statement for reuse
        const statement = await this.db.prepareAsync(
          'INSERT INTO daily_entry_items (entry_id, type, content) VALUES (?, ?, ?)'
        );
        try {
          // Execute prepared statement for each item
          for (const item of items) {
            await statement.executeAsync([entryId, item.type, item.content]);
          }
        } finally {
          // Always finalize the prepared statement
          await statement.finalizeAsync();
        }
      }
      // Commit the transaction after all operations succeed
      await this.db.execAsync('COMMIT');
    } catch (error) {
      // Roll back transaction on error
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  async getDailyEntry(date: string): Promise<DailyEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT * FROM daily_entries WHERE date = ?
    `, [date]);

    if (!result) return null;

    const entry = this.transformRowToDailyEntry(result as any);
    await this.fetchEntryItems(entry);
    return entry;
  }

  async getDailyEntries(startDate: string, endDate: string): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM daily_entries 
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `, [startDate, endDate]);

    const entries = results.map(row => this.transformRowToDailyEntry(row as any));
    
    // Fetch items for each entry
    for (const entry of entries) {
      await this.fetchEntryItems(entry);
    }

    return entries;
  }

  async getRecentEntries(limit: number = 7): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM daily_entries 
      ORDER BY date DESC 
      LIMIT ?
    `, [limit]);

    const entries = results.map(row => this.transformRowToDailyEntry(row as any));
    
    // Fetch items for each entry
    for (const entry of entries) {
      await this.fetchEntryItems(entry);
    }

    return entries;
  }

  private async fetchEntryItems(entry: DailyEntry): Promise<void> {
    if (!this.db || !entry.id) return;
    
    const items = await this.db.getAllAsync(`
      SELECT type, content FROM daily_entry_items WHERE entry_id = ?
    `, [entry.id]);

    entry.accomplishments = items.filter(i => (i as any).type === 'accomplishment').map(i => (i as any).content);
    entry.things_learned = items.filter(i => (i as any).type === 'learning').map(i => (i as any).content);
    entry.things_grateful = items.filter(i => (i as any).type === 'grateful').map(i => (i as any).content);
  }

  async saveSummary(summary: Summary): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(`
      INSERT INTO summaries (type, start_date, end_date, content, insights)
      VALUES (?, ?, ?, ?, ?)
    `, [
      summary.type,
      summary.start_date,
      summary.end_date,
      summary.content,
      JSON.stringify(summary.insights)
    ]);

    return result.lastInsertRowId;
  }

  async getSummaries(type: 'weekly' | 'monthly' | 'yearly'): Promise<Summary[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM summaries 
      WHERE type = ?
      ORDER BY start_date DESC
    `, [type]);

    return results.map(row => this.transformRowToSummary(row as any));
  }

  async getEntriesForWeeklySummary(weekStartDate: string): Promise<DailyEntry[]> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    // Use consistent local date handling to avoid timezone issues
    const year = weekEndDate.getFullYear();
    const month = String(weekEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(weekEndDate.getDate()).padStart(2, '0');
    const weekEndDateStr = `${year}-${month}-${day}`;
    
    return this.getDailyEntries(
      weekStartDate,
      weekEndDateStr
    );
  }

  async getWeeklySummariesForMonth(monthStartDate: string): Promise<Summary[]> {
    const monthEndDate = new Date(monthStartDate);
    monthEndDate.setMonth(monthEndDate.getMonth() + 1);
    monthEndDate.setDate(0); // Last day of the month

    if (!this.db) throw new Error('Database not initialized');

    // Use consistent local date handling to avoid timezone issues
    const year = monthEndDate.getFullYear();
    const month = String(monthEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(monthEndDate.getDate()).padStart(2, '0');
    const monthEndDateStr = `${year}-${month}-${day}`;

    const results = await this.db.getAllAsync(`
      SELECT * FROM summaries 
      WHERE type = 'weekly' 
      AND start_date >= ? 
      AND end_date <= ?
      ORDER BY start_date ASC
    `, [
      monthStartDate,
      monthEndDateStr
    ]);

    return results.map(row => this.transformRowToSummary(row as any));
  }

  private transformRowToDailyEntry(row: any): DailyEntry {
    return {
      id: row?.id,
      date: row?.date || '',
      daily_text: row?.daily_text || '',
      accomplishments: [],
      things_learned: [],
      things_grateful: [],
      ratings: {
        productivity: row?.productivity_rating || 3,
        mood: row?.mood_rating || 3,
        energy: row?.energy_rating || 3,
      },
      created_at: row?.created_at,
      updated_at: row?.updated_at,
    };
  }

  private safeParseJSON(jsonString: string, fallback: any = {}, rowId?: any): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(`Failed to parse JSON for row ${rowId || 'unknown'}:`, error);
      return fallback;
    }
  }

  private transformRowToSummary(row: any): Summary {
    return {
      id: row.id,
      type: row.type,
      start_date: row.start_date,
      end_date: row.end_date,
      content: row.content,
      insights: this.safeParseJSON(row.insights || '{}', {
        key_themes: [],
        productivity_trend: 0,
        mood_trend: 0,
        energy_trend: 0,
        top_accomplishments: [],
        main_learnings: [],
      }, row.id),
      created_at: row.created_at,
    };
  }

  async deleteEntry(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Deleting the entry will also delete its items due to ON DELETE CASCADE
    await this.db.runAsync('DELETE FROM daily_entries WHERE id = ?', [id]);
  }

  async deleteSummary(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.runAsync('DELETE FROM summaries WHERE id = ?', [id]);
  }

  async getEntryCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM daily_entries');
    return (result as any)?.count || 0;
  }

  async getSummaryCount(type: 'weekly' | 'monthly' | 'yearly'): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM summaries WHERE type = ?',
      [type]
    );
    return (result as any)?.count || 0;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
