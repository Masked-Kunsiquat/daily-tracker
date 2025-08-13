// ============================================
// hooks/useHomeData.ts
// ============================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { databaseService, DailyEntry } from '../lib/database';
import { summaryService } from '../lib/summaryService';
import { formatDateISO } from '../utils/dateHelpers';

export interface SummaryStats {
  weekly: number;
  monthly: number;
  yearly: number;
}

export const useHomeData = () => {
  const [loading, setLoading] = useState(true);
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  
  const todayISO = formatDateISO();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      await databaseService.initialize();

      const [entries, todaysEntry, stats] = await Promise.all([
        databaseService.getRecentEntries(7),
        databaseService.getDailyEntry(todayISO),
        summaryService.getSummaryStats(),
      ]);

      if (!mountedRef.current) return;

      setRecentEntries(entries);
      setTodayEntry(todaysEntry);
      setSummaryStats(stats);

      // Fire and forget background task
      summaryService.checkAndGeneratePendingSummaries().catch(console.error);
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [todayISO]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    recentEntries,
    summaryStats,
    todayEntry,
    todayISO,
    refresh,
  };
};
