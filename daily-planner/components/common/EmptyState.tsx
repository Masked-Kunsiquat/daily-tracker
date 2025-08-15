// components/common/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';
import { Button } from './Button';

/**
 * Props for {@link EmptyState}.
 */
interface EmptyStateProps {
  /** Optional leading emoji or glyph (simple string). Defaults to '📝'. */
  icon?: string;
  /** Headline for the empty state. Short and action-oriented is best. */
  title: string;
  /** Supporting copy giving context or next steps. */
  message?: string;
  /** Label for the primary CTA button. Rendered only if `onAction` is provided. */
  actionLabel?: string;
  /** Callback for the CTA button press. Rendered only if `actionLabel` is provided. */
  onAction?: () => void;
}

/**
 * EmptyState
 *
 * A centered, minimal empty-state presenter with optional emoji icon, title,
 * supporting message, and an optional primary action button.
 *
 * Usage:
 * - Show when there is no data to render (first-run, cleared lists, filters).
 * - Provide `actionLabel` + `onAction` to guide the user toward resolution.
 *
 * Accessibility:
 * - Text elements are readable by screen readers; keep `title` concise and meaningful.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📝',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} size="medium" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  /** Wrapper centers content and provides generous breathing room. */
  container: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Large emoji/glyph for quick visual context. */
  icon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  /** Prominent headline. */
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  /** Supportive, secondary text with comfortable line height. */
  message: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  /** Spacing above the optional action button. */
  action: {
    marginTop: Spacing.xl,
  },
});
