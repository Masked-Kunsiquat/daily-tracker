// components/common/LoadingScreen.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * Props for {@link LoadingScreen}.
 */
interface LoadingScreenProps {
  /** Optional helper text shown under the spinner. Defaults to `"Loading..."`. */
  message?: string;
  /**
   * If true, the loader fills available space (`flex:1`) and centers itself.
   * If false, renders as an inline block with padding (useful inside cards/rows).
   * Defaults to `true`.
   */
  fullScreen?: boolean;
  /** Spinner size passed to `ActivityIndicator`; defaults to `'large'`. */
  size?: 'small' | 'large';
  /** Spinner color; defaults to theme primary. */
  color?: string;
}

/**
 * LoadingScreen
 *
 * A simple loading presenter that can be used full-screen or inline.
 * - Full-screen mode centers content with `flex:1`.
 * - Inline mode uses padding and inherits parent layout.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  fullScreen = true,
  size = 'large',
  color = Colors.primary,
}) => {
  const containerStyle = fullScreen ? styles.fullScreen : styles.inline;

  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  /** Base wrapper for both full-screen and inline modes. */
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  } as ViewStyle,

  /** Expands to fill and center within the viewport. */
  fullScreen: {
    flex: 1,
  } as ViewStyle,

  /** Compact inline presentation for embedded loaders. */
  inline: {
    padding: Spacing.xl,
  } as ViewStyle,

  /** Optional helper text below the spinner. */
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  } as TextStyle,
});
