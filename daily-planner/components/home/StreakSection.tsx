// components/home/StreakSection.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * Props for {@link StreakSection}.
 */
interface StreakSectionProps {
  /** Number of days logged in the current week. If 0, the section is hidden. */
  entryCount: number;
}

/**
 * StreakSection
 *
 * Compact banner that celebrates the user's weekly journaling streak.
 * - Renders `null` when `entryCount` is 0 (no banner clutter).
 * - Uses singular/plural copy based on the count.
 */
export const StreakSection: React.FC<StreakSectionProps> = ({ entryCount }) => {
  if (entryCount === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Journal Streak</Text>
      <Text style={styles.text}>
        {entryCount} {entryCount === 1 ? 'day' : 'days'} logged this week
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  /** Highlighted container; subtle, celebratory look. */
  container: {
    margin: Spacing.xl,
    marginTop: 0,
    padding: Spacing.lg,
    backgroundColor: '#fff8dc', // light gold (matches the celebratory tone)
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e68c',
    alignItems: 'center',
  } as ViewStyle,
  /** Banner title. */
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  } as TextStyle,
  /** Supporting line with count + timeframe. */
  text: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  } as TextStyle,
});
