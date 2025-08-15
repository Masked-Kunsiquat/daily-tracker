// daily-planner/app/summaries/[type].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { summaryService } from '@/lib/summaryService';
import { Summary } from '@/lib/database';
import { RefreshableScrollView, LoadingScreen, EmptyState, Button } from '@/components/common';
import { SummaryDetailCard } from '@/components/summaries/SummaryDetailCard';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';
import { formatDateISO } from '@/utils/dateHelpers';

/** Supported summary route segment. */
type SummaryType = 'weekly' | 'monthly' | 'yearly';

/**
 * Copy and a11y strings per summary type.
 * Keep user-facing language short and scannable.
 */
const SUMMARY_TYPE_CONFIG = {
  weekly: {
    title: 'Weekly Summaries',
    description: 'Your week in review',
    emptyMessage:
      'No weekly summaries yet. Keep logging daily entries for at least 3 days in a week to generate your first weekly summary!',
    icon: '📅',
  },
  monthly: {
    title: 'Monthly Summaries',
    description: 'Your month in review',
    emptyMessage:
      'No monthly summaries yet. You need at least 2 weekly summaries in a month to generate a monthly summary.',
    icon: '🗓️',
  },
  yearly: {
    title: 'Yearly Summaries',
    description: 'Your year in review',
    emptyMessage:
      'No yearly summaries yet. You need at least 6 monthly summaries in a year to generate a yearly summary.',
    icon: '📈',
  },
} as const;

/**
 * SummaryTypeScreen
 *
 * Route: `/summaries/[type]`
 *
 * Responsibilities:
 * - Validate `type` URL param and map to config
 * - Backfill any missing summaries (weekly/monthly/yearly) before fetching
 * - Render list of {@link SummaryDetailCard}s for the chosen type
 * - Provide pull-to-refresh, share, and "Try Generate" (force) actions
 *
 * Safety:
 * - Uses `mountedRef` to avoid state updates after unmount
 * - Catches and surfaces errors via `Alert` while logging to console
 */
export default function SummaryTypeScreen() {
  const { type: paramType } = useLocalSearchParams();

  // Safely normalize and validate the parameter
  const normalizedParam = Array.isArray(paramType) ? paramType[0] : paramType;
  const isValidSummaryType = (value: string | undefined): value is SummaryType => {
    return value !== undefined && ['weekly', 'monthly', 'yearly'].includes(value);
  };

  const summaryType = isValidSummaryType(normalizedParam) ? normalizedParam : null;
  const config = summaryType ? SUMMARY_TYPE_CONFIG[summaryType] : null;

  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<Summary[]>([]);

  /** Prevent setState calls after unmount. */
  const mountedRef = useRef(true);

  /**
   * Fetch summaries for the current type.
   * - First triggers pending-generation checks
   * - Then loads and stores the list for this type
   */
  const loadSummaries = useCallback(async () => {
    // Guard against invalid summary types - don't call service or change state
    if (!summaryType) return;

    try {
      setLoading(true);

      // Check and generate any pending summaries first
      await summaryService.checkAndGeneratePendingSummaries();

      // Then fetch the summaries for this type
      const data = await summaryService.getSummaries(summaryType);

      if (mountedRef.current) {
        setSummaries(data);
      }
    } catch (error) {
      console.error(`Error loading ${summaryType} summaries:`, error);
      if (mountedRef.current) {
        Alert.alert('Error', `Failed to load ${summaryType} summaries`);
      }
    } finally {
      // Only toggle loading state if we have a valid summaryType
      if (summaryType && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [summaryType]);

  /** Pull-to-refresh handler (wraps `loadSummaries`). */
  const onRefresh = useCallback(async () => {
    await loadSummaries();
  }, [loadSummaries]);

  /**
   * Share a single summary using the OS share sheet.
   * Includes the title, date range, and the summary content.
   */
  const handleShareSummary = useCallback(
    async (summary: Summary) => {
      if (!config) return;

      try {
        const title = config?.title ?? 'Daily Planner';
        const dateRange = `${summary.start_date} to ${summary.end_date}`;
        const shareContent = `${title} - ${dateRange}\n\n${summary.content}`;

        await Share.share({
          message: shareContent,
          title: `${title} - ${dateRange}`,
        });
      } catch (error) {
        console.error('Error sharing summary:', error);
        Alert.alert('Error', 'Failed to share summary');
      }
    },
    [config?.title],
  );

  /**
   * Force-generate a summary for the **previous** period:
   * - Weekly: last completed week (last Monday)
   * - Monthly: first day of last month
   * - Yearly: first day of last year
   *
   * Useful when the user has enough source data but the auto backfill hasn't run yet.
   */
  const handleForceGenerate = useCallback(async () => {
    // Guard against invalid summary types
    if (!summaryType || !['weekly', 'monthly', 'yearly'].includes(summaryType)) {
      Alert.alert('Error', 'Invalid summary type. Cannot generate summary.');
      return;
    }

    try {
      setLoading(true);

      // For demo purposes, try to force generate a summary for current period
      const now = new Date();
      let dateStr: string;

      if (summaryType === 'weekly') {
        // Last Monday (previous week), computed from local midnight
        const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dow = todayLocal.getDay(); // 0=Sun,1=Mon,...
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const lastMonday = new Date(todayLocal);
        lastMonday.setDate(lastMonday.getDate() + mondayOffset - 7); // previous week
        dateStr = formatDateISO(lastMonday);
      } else if (summaryType === 'monthly') {
        // First day of last month (local)
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateStr = formatDateISO(firstOfLastMonth);
      } else {
        // First day of last year (local)
        const firstOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        dateStr = formatDateISO(firstOfLastYear);
      }

      await summaryService.forceSummaryGeneration(summaryType, dateStr);
      await loadSummaries();

      Alert.alert('Success', 'Summary generated successfully!');
    } catch (error) {
      console.error('Error force generating summary:', error);
      Alert.alert(
        'Note',
        'Could not generate summary. You may need more entries or existing summaries for the selected period.',
      );
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  }, [summaryType, loadSummaries]);

  useEffect(() => {
    loadSummaries();
    return () => {
      mountedRef.current = false;
    };
  }, [loadSummaries]);

  // Validate summary type after all hooks are declared
  if (!summaryType || !config) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid summary type: {paramType}</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen message={`Loading ${summaryType} summaries...`} />;
  }

  return (
    <RefreshableScrollView
      style={styles.container}
      onRefresh={onRefresh}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {config.icon} {config.title}
        </Text>
        <Text style={styles.headerSubtitle}>{config.description}</Text>
      </View>

      {summaries.length > 0 ? (
        <View style={styles.summariesContainer}>
          {summaries.map((summary) => (
            <SummaryDetailCard
              key={summary.id}
              summary={summary}
              onShare={() => handleShareSummary(summary)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={config.icon}
          title={`No ${summaryType} summaries yet`}
          message={config.emptyMessage}
          actionLabel="Try Generate"
          onAction={handleForceGenerate}
        />
      )}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  /** Screen background and base layout. */
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  /** Scroll content padding. */
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  /** Header block with title + description. */
  header: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  /** Container for the list of summary cards. */
  summariesContainer: {
    gap: Spacing.lg,
  },
  /** Error fallback when the route param is invalid. */
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: Typography.sizes.lg,
    color: Colors.danger,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
});
