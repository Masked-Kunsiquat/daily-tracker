// components/home/StreakSection.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

interface StreakSectionProps {
  entryCount: number;
}

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
  container: {
    margin: Spacing.xl,
    marginTop: 0,
    padding: Spacing.lg,
    backgroundColor: '#fff8dc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e68c',
    alignItems: 'center',
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  } as TextStyle,
  text: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  } as TextStyle,
});
