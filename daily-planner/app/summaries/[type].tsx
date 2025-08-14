// daily-planner/app/summaries/[type].tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { summaryService } from '@/lib/summaryService';
import { Summary } from '@/lib/database';
import { 
  RefreshableScrollView, 
  LoadingScreen, 
  EmptyState, 
  Button 
} from '@/components/common';
import { SummaryDetailCard } from '@/components/summaries/SummaryDetailCard';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

type SummaryType = 'weekly' | 'monthly' | 'yearly';

const SUMMARY_TYPE_CONFIG = {
  weekly: {
    title: 'Weekly Summaries',
    description: 'Your week in review',
    emptyMessage: 'No weekly summaries yet. Keep logging daily entries for at least 3 days in a week to generate your first weekly summary!',
    icon: '📅'
  },
  monthly: {
    title: 'Monthly Summaries', 
    description: 'Your month in review',
    emptyMessage: 'No monthly summaries yet. You need at least 2 weekly summaries in a month to generate a monthly summary.',
    icon: '🗓️'
  },
  yearly: {
    title: 'Yearly Summaries',
    description: 'Your year in review', 
    emptyMessage: 'No yearly summaries yet. You need at least 6 monthly summaries in a year to generate a yearly summary.',
    icon: '📈'
  }
};

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
  
  const mountedRef = useRef(true);

  const loadSummaries = useCallback(async () => {
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
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [summaryType]);

  const onRefresh = useCallback(async () => {
    await loadSummaries();
  }, [loadSummaries]);

  const handleShareSummary = useCallback(async (summary: Summary) => {
    if (!config) return;
    
    try {
      const dateRange = `${summary.start_date} to ${summary.end_date}`;
      const shareContent = `${config.title} - ${dateRange}\n\n${summary.content}`;
      
      await Share.share({
        message: shareContent,
        title: `${config.title} - ${dateRange}`,
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      Alert.alert('Error', 'Failed to share summary');
    }
  }, [config]);

  const handleForceGenerate = useCallback(async () => {
    if (!summaryType) return;
    
    try {
      setLoading(true);
      
      // For demo purposes, try to force generate a summary for current period
      const now = new Date();
      let dateStr: string;
      
      if (summaryType === 'weekly') {
        // Get last Monday
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(monday.getDate() + mondayOffset - 7); // Previous week
        dateStr = monday.toISOString().split('T')[0];
      } else if (summaryType === 'monthly') {
        // Get first day of last month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateStr = lastMonth.toISOString().split('T')[0];
      } else {
        // Get first day of last year
        dateStr = `${now.getFullYear() - 1}-01-01`;
      }
      
      await summaryService.forceSummaryGeneration(summaryType, dateStr);
      await loadSummaries();
      
      Alert.alert('Success', 'Summary generated successfully!');
    } catch (error) {
      console.error('Error force generating summary:', error);
      Alert.alert('Note', 'Could not generate summary. You may need more entries or existing summaries for the selected period.');
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
        <Text style={styles.headerTitle}>{config.icon} {config.title}</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
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
  summariesContainer: {
    gap: Spacing.lg,
  },
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