// components/home/QuickActions.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';
import { Badge } from '@/components/common/Badge';
import { SummaryStats } from '@/hooks/useHomeData';

interface QuickActionsProps {
  todayISO: string;
  hasEntryToday: boolean;
  summaryStats: SummaryStats;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  todayISO,
  hasEntryToday,
  summaryStats,
}) => {
  return (
    <View style={styles.container}>
      <Link
        href={{
          pathname: '/daily-entry',
          params: { date: todayISO },
        }}
        asChild>
        <TouchableOpacity style={styles.primaryButton} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>
            {hasEntryToday ? "✏️ Edit Today's Entry" : '📝 New Daily Entry'}
          </Text>
        </TouchableOpacity>
      </Link>

      <Link href="/summaries" asChild>
        <TouchableOpacity
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityHint="View weekly, monthly, and yearly summaries">
          <Text style={styles.secondaryButtonText}>📊 View Summaries</Text>
          <View style={styles.badges}>
            <Badge label={`${summaryStats.weekly}W`} size="small" />
            <Badge label={`${summaryStats.monthly}M`} size="small" />
            <Badge label={`${summaryStats.yearly}Y`} size="small" />
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: 0,
    gap: 15,
  } as ViewStyle,
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  } as ViewStyle,
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  } as TextStyle,
  secondaryButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  secondaryButtonText: {
    color: Colors.text,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  } as TextStyle,
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  } as ViewStyle,
});
