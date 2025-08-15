// daily-planner/components/summaries/SummaryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { router } from 'expo-router';
import { Badge, Card } from '../common';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';
import { SummaryType } from '@/lib/ai/llm/types';

/**
 * Props for {@link SummaryCard}.
 */
interface SummaryCardProps {
  /** Section title (e.g., "Weekly Summary"). */
  title: string;
  /** Short description of what this summary contains. */
  description: string;
  /** Count badge value. Typically the number of summaries available. */
  count: number;
  /** Summary route segment to open when pressed. */
  summaryType: SummaryType;
  /** Optional custom press handler; if omitted, navigates to `/summaries/[type]`. */
  onPress?: () => void;
  /** Optional screen-reader label override. */
  accessibilityLabel?: string;
  /** Optional screen-reader hint override. */
  accessibilityHint?: string;
}

/**
 * SummaryCard
 *
 * Reusable card showing a summary type with a count badge.
 * - Pressing navigates to `/summaries/[type]` unless a custom `onPress` is provided.
 * - Includes accessible label/hint with sensible defaults.
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  description,
  count,
  summaryType,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) => {
  /** Navigate to the typed summary route unless a custom handler is provided. */
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/summaries/[type]',
        params: { type: summaryType },
      });
    }
  };

  /** Provide meaningful SR defaults while allowing explicit overrides. */
  const a11yLabel =
    accessibilityLabel ?? `${title}. ${description}. ${count} ${count === 1 ? 'item' : 'items'}.`;
  const a11yHint = accessibilityHint ?? 'Opens details.';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
    >
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
          <Badge label={String(count)} variant="primary" size="medium" />
        </View>
        {/* Decorative arrow; hidden from screen readers */}
        <Text
          style={styles.arrow}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          ›
        </Text>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  } as ViewStyle,
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  } as TextStyle,
  cardDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  } as TextStyle,
  arrow: {
    fontSize: 24,
    color: Colors.textMuted,
    marginLeft: Spacing.md,
  } as TextStyle,
});
