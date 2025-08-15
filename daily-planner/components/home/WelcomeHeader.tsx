// components/home/WelcomeHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';
import { formatDateHuman } from '@/utils/dateHelpers';
import { Colors } from '@/styles/colors';

/**
 * Props for {@link WelcomeHeader}.
 */
interface WelcomeHeaderProps {
  /** If true, copy nudges the user to update today's entry; otherwise prompts planning. */
  hasEntryToday: boolean;
}

/**
 * WelcomeHeader
 *
 * Centered header that shows today's human-readable date and a short prompt.
 * - Uses `formatDateHuman()` for localized, friendly date text.
 * - Message switches based on whether an entry already exists for today.
 */
export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ hasEntryToday }) => {
  const dateString = formatDateHuman();

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{dateString}</Text>
      <Text style={styles.welcomeText}>
        {hasEntryToday ? "Ready to update today's entry?" : 'Ready to plan your day?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  /** Wrapper centers the header content with comfortable spacing. */
  container: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    alignItems: 'center',
  } as ViewStyle,
  /** Subtle date line. */
  dateText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  /** Prominent welcome message. */
  welcomeText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: 'center',
  } as TextStyle,
});
