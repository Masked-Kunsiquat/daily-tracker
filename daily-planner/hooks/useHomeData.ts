// hooks/useHomeData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { databaseService, DailyEntry } from '@/lib/database';
import { summaryService } from '@/lib/summaryService';
import { formatDateISO } from '@/utils/dateHelpers';

/**
 * Summary counts available for each time window.
 */
export interface SummaryStats {
  /** Number of weekly summaries available. */
  weekly: number;
  /** Number of monthly summaries available. */
  monthly: number;
  /** Number of yearly summaries available. */
  yearly: number;
}

/**
 * useHomeData
 *
 * Aggregates all data needed for the Home screen:
 * - Recent daily entries (default last 7)
 * - Today's entry (if any)
 * - Summary counts (weekly/monthly/yearly)
 *
 * Behavior & safety:
 * - Initializes the database (idempotent) before fetching.
 * - Uses a mounted ref to avoid `setState` after unmount.
 * - Runs a fire-and-forget background task to generate any pending summaries.
 *
 * Returns loading flags, data, today's local ISO date, and a `refresh()` method.
 */
export const useHomeData = () => {
  const [loading, setLoading] = useState(true);
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);

  /** Today's date in local ISO (YYYY-MM-DD) used for "today" queries. */
  const todayISO = formatDateISO();

  /** Tracks component mount state to prevent setState calls after unmount. */
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Load all home-screen data in parallel after ensuring DB is ready.
   * Errors are logged and swallowed so the UI can decide how to proceed.
   */
  const loadData = useCallback(async () => {
    try {
      // Initialize database (now idempotent, so safe to call multiple times)
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
      // Don't re-throw here to prevent unhandled rejections
      // The error is logged and the component stays in loading state
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [todayISO]);

  /**
   * Public refresh handler for pull-to-refresh or manual reload.
   * Wraps `loadData` and logs any thrown errors.
   */
  const refresh = useCallback(async () => {
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Handle refresh errors gracefully without crashing
    }
  }, [loadData]);

  useEffect(() => {
    // Handle promise rejection in useEffect with proper error handling
    loadData().catch(error => {
      console.error('Error in initial data load:', error);
      // Error is already handled in loadData, but this prevents unhandled rejections
    });
  }, [loadData]);

  return {
    /** True while initial load (or reload) is in progress. */
    loading,
    /** Recent entries for display on the home screen. */
    recentEntries,
    /** Summary counters for the quick-actions / summaries card. */
    summaryStats,
    /** Today's entry if it exists; null otherwise. */
    todayEntry,
    /** Today's local ISO date (YYYY-MM-DD). */
    todayISO,
    /** Invoke to re-fetch all home data. */
    refresh,
  };
};
