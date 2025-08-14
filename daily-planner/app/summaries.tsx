import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { router } from 'expo-router';
import { summaryService } from '@/lib/summaryService';
import { Summary } from '@/lib/database';
import { RefreshableScrollView, LoadingScreen, EmptyState } from '@/components/common';
import { SummaryCard } from '@/components/summaries/SummaryCard';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

type SummaryType = 'weekly' | 'monthly' | 'yearly';

export default function SummariesScreen() {
  const [loading, setLoading] = useState(true);
  const [weeklySummaries, setWeeklySummaries] = useState<Summary[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<Summary[]>([]);
  const [yearlySummaries, setYearlySummaries] = useState<Summary[]>([]);

  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await summaryService.checkAndGeneratePendingSummaries();
      const [weekly, monthly, yearly] = await Promise.all([
        summaryService.getSummaries('weekly'),
        summaryService.getSummaries('monthly'),
        summaryService.getSummaries('yearly'),
      ]);

      if (!mountedRef.current) return;

      setWeeklySummaries(weekly);
      setMonthlySummaries(monthly);
      setYearlySummaries(yearly);
    } catch (error) {
      console.error('Failed to load summaries:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const handlePressSummary = (type: SummaryType) => {
    router.push(`/summaries/${type}` as any);
  };

  const hasAnySummaries =
    weeklySummaries.length > 0 || monthlySummaries.length > 0 || yearlySummaries.length > 0;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <RefreshableScrollView
      style={styles.container}
      onRefresh={onRefresh}
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>AI-powered insights from your daily entries</Text>
      </View>

      {hasAnySummaries ? (
        <View>
          <SummaryCard
            title="Weekly Summaries"
            description="View your past week's insights."
            count={weeklySummaries.length}
            onPress={() => handlePressSummary('weekly')}
          />
          <SummaryCard
            title="Monthly Summaries"
            description="View your past month's insights."
            count={monthlySummaries.length}
            onPress={() => handlePressSummary('monthly')}
          />
          <SummaryCard
            title="Yearly Summaries"
            description="View your past year's insights."
            count={yearlySummaries.length}
            onPress={() => handlePressSummary('yearly')}
          />
        </View>
      ) : (
        <EmptyState
          icon="📝"
          title="No summaries yet"
          message="Keep logging your daily entries to generate your first summary!"
        />
      )}
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  } as ViewStyle,
  header: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  } as TextStyle,
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,
});