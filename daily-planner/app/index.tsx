// ============================================
// app/index.tsx
// ============================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { RefreshableScrollView } from '@/components/common/RefreshableScrollView';
import { WelcomeHeader } from '@/components/home/WelcomeHeader';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentEntriesSection } from '@/components/home/RecentEntriesSection';
import { StreakSection } from '@/components/home/StreakSection';
import { useHomeData } from '@/hooks/useHomeData';
import { Colors } from '@/styles/colors';

// Helper function to calculate entries for current week
const getWeeklyEntryCount = (recentEntries: any[], todayISO: string): number => {
  const today = new Date(todayISO);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  const weekStartISO = weekStart.toISOString().split('T')[0];

  return recentEntries.filter(entry => entry.date >= weekStartISO).length;
};

export default function HomeScreen() {
  const {
    loading,
    recentEntries,
    summaryStats,
    todayEntry,
    todayISO,
    refresh,
  } = useHomeData();

  if (loading) {
    return <LoadingScreen message="Loading your journal..." />;
  }

  // Calculate actual weekly entry count
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
        
        <RecentEntriesSection 
          entries={recentEntries} 
          todayISO={todayISO} 
        />
        
        <StreakSection entryCount={weeklyEntryCount} />
      </RefreshableScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});