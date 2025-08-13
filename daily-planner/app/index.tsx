// ============================================
// app/index.tsx - REFACTORED
// ============================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { RefreshableScrollView } from '../components/common/RefreshableScrollView';
import { WelcomeHeader } from '../components/home/WelcomeHeader';
import { QuickActions } from '../components/home/QuickActions';
import { RecentEntriesSection } from '../components/home/RecentEntriesSection';
import { StreakSection } from '../components/home/StreakSection';
import { useHomeData } from '../hooks/useHomeData';
import { Colors } from '../styles/colors';

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
        
        <StreakSection entryCount={recentEntries.length} />
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