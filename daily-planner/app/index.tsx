// daily-planner/app/index.tsx
import React from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { RefreshableScrollView } from '@/components/common/RefreshableScrollView';
import { WelcomeHeader } from '@/components/home/WelcomeHeader';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentEntriesSection } from '@/components/home/RecentEntriesSection';
import { StreakSection } from '@/components/home/StreakSection';
import { useHomeData } from '@/hooks/useHomeData';
import type { DailyEntry } from '@/lib/database';
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers'; // ⬅️ add

// Helper function to calculate entries for current week (Mon–Sun) using LOCAL dates
const getWeeklyEntryCount = (recentEntries: DailyEntry[], todayISO: string): number => {
  const today = parseLocalISODate(todayISO); // ⬅️ local-safe parse for YYYY-MM-DD
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Start from local midnight, then shift to Monday
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  const weekStartISO = formatDateISO(weekStart); // ⬅️ no split('T')

  return recentEntries.filter((entry) => entry.date >= weekStartISO).length;
};

export default function HomeScreen() {
  const { loading, recentEntries, summaryStats, todayEntry, todayISO, refresh } = useHomeData();

  if (loading) {
    return <LoadingScreen message="Loading your journal..." />;
  }

  const weeklyEntryCount = getWeeklyEntryCount(recentEntries, todayISO);

  return (
    <ErrorBoundary>
      <RefreshableScrollView onRefresh={refresh}>
        <WelcomeHeader hasEntryToday={!!todayEntry} />

        <QuickActions
          todayISO={todayISO}
          hasEntryToday={!!todayEntry}
          summaryStats={summaryStats}
        />

        <RecentEntriesSection entries={recentEntries} todayISO={todayISO} />

        <StreakSection entryCount={weeklyEntryCount} />
      </RefreshableScrollView>
    </ErrorBoundary>
  );
}
