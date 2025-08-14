// components/summaries/SummaryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Badge, Card } from '../common';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

interface SummaryCardProps {
  title: string;
  description: string;
  count: number;
  onPress: () => void; // Remove summaryType since onPress is always provided
  /** Optional overrides for screen reader text */
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * A reusable card component to display a summary type with a count badge.
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  description,
  count,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) => {
  // Provide meaningful defaults while allowing explicit overrides
  const a11yLabel =
    accessibilityLabel ?? `${title}. ${description}. ${count} ${count === 1 ? 'item' : 'items'}.`;
  const a11yHint = accessibilityHint ?? 'Opens details.';

  return (
    <TouchableOpacity
      onPress={onPress}
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
        <Text
          style={styles.arrow}
          accessible={false}
          accessibilityElementsHidden={true}
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