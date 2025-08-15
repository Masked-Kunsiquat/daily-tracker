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
import { parseLocalISODate, formatDateISO } from '@/utils/dateHelpers';

/**
 * Compute how many entries fall within the **current local week** (Mon–Sun).
 *
 * Approach:
 * - Parse `todayISO` with `parseLocalISODate` to avoid UTC off-by-one issues.
 * - Derive the Monday of the current week in **local time**.
 * - Convert that Monday to local ISO (`YYYY-MM-DD`) and count entries whose
 *   `entry.date >= weekStartISO`. (Assumes `entry.date` is also local ISO.)
 *
 * Notes:
 * - Week starts on Monday; Sunday is treated as day 0 so we offset by -6.
 * - We only need a lower bound since `recentEntries` contains recent days.
 *
 * @param recentEntries - List of recent entries (dates as local ISO).
 * @param todayISO - Today's local ISO date (YYYY-MM-DD).
 * @returns Number of entries logged this week.
 */
const getWeeklyEntryCount = (recentEntries: DailyEntry[], todayISO: string): number => {
  const today = parseLocalISODate(todayISO); // Local-safe parse for YYYY-MM-DD
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Start from local midnight, then shift to Monday
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  const weekStartISO = formatDateISO(weekStart); // Local ISO, no time component
  return recentEntries.filter((entry) => entry.date >= weekStartISO).length;
};

/**
 * HomeScreen
 *
 * The app landing page that pulls home data, shows quick actions, recent entries,
 * and a simple weekly streak. Protected by an {@link ErrorBoundary}.
 *
 * Loading:
 * - Shows {@link LoadingScreen} until `useHomeData` finishes.
 *
 * Content:
 * - {@link WelcomeHeader} (date + prompt)
 * - {@link QuickActions} (new/edit entry, summaries)
 * - {@link RecentEntriesSection} (list of recent daily entries)
 * - {@link StreakSection} (Mon–Sun count computed locally)
 */
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
