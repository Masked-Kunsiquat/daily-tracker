// lib/database.ts
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

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('daily_planner.db');
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Daily entries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        daily_text TEXT,
        accomplishments TEXT,
        things_learned TEXT,
        things_grateful TEXT,
        productivity_rating INTEGER,
        mood_rating INTEGER,
        energy_rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      CREATE INDEX IF NOT EXISTS idx_summaries_type_date ON summaries(type, start_date, end_date);
    `);
  }

  async saveDailyEntry(entry: DailyEntry): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(`
      INSERT OR REPLACE INTO daily_entries (
        date, daily_text, accomplishments, things_learned, things_grateful,
        productivity_rating, mood_rating, energy_rating, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      entry.date,
      entry.daily_text,
      JSON.stringify(entry.accomplishments),
      JSON.stringify(entry.things_learned),
      JSON.stringify(entry.things_grateful),
      entry.ratings.productivity,
      entry.ratings.mood,
      entry.ratings.energy
    ]);

    return result.lastInsertRowId;
  }

  async getDailyEntry(date: string): Promise<DailyEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(`
      SELECT * FROM daily_entries WHERE date = ?
    `, [date]);

    if (!result) return null;

    return this.transformRowToDailyEntry(result as any);
  }

  async getDailyEntries(startDate: string, endDate: string): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM daily_entries 
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `, [startDate, endDate]);

    return results.map(row => this.transformRowToDailyEntry(row as any));
  }

  async getRecentEntries(limit: number = 7): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM daily_entries 
      ORDER BY date DESC 
      LIMIT ?
    `, [limit]);

    return results.map(row => this.transformRowToDailyEntry(row as any));
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
    
    return this.getDailyEntries(
      weekStartDate,
      weekEndDate.toISOString().split('T')[0]
    );
  }

  async getWeeklySummariesForMonth(monthStartDate: string): Promise<Summary[]> {
    const monthEndDate = new Date(monthStartDate);
    monthEndDate.setMonth(monthEndDate.getMonth() + 1);
    monthEndDate.setDate(0); // Last day of the month

    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync(`
      SELECT * FROM summaries 
      WHERE type = 'weekly' 
      AND start_date >= ? 
      AND end_date <= ?
      ORDER BY start_date ASC
    `, [
      monthStartDate,
      monthEndDate.toISOString().split('T')[0]
    ]);

    return results.map(row => this.transformRowToSummary(row as any));
  }

  private transformRowToDailyEntry(row: any): DailyEntry {
    return {
      id: row.id,
      date: row.date,
      daily_text: row.daily_text || '',
      accomplishments: JSON.parse(row.accomplishments || '[]'),
      things_learned: JSON.parse(row.things_learned || '[]'),
      things_grateful: JSON.parse(row.things_grateful || '[]'),
      ratings: {
        productivity: row.productivity_rating || 3,
        mood: row.mood_rating || 3,
        energy: row.energy_rating || 3,
      },
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private transformRowToSummary(row: any): Summary {
    return {
      id: row.id,
      type: row.type,
      start_date: row.start_date,
      end_date: row.end_date,
      content: row.content,
      insights: JSON.parse(row.insights || '{}'),
      created_at: row.created_at,
    };
  }

  async deleteEntry(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
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
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();