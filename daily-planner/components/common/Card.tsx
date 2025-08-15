// components/common/Card.tsx
import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { Colors } from '@/styles/colors';
import { Spacing, SpacingSize } from '@/styles/spacing';

/**
 * Props for {@link Card}.
 */
interface CardProps {
  /** Card contents. */
  children: React.ReactNode;
  /** Optional container style overrides (merged last). */
  style?: StyleProp<ViewStyle>;
  /** Internal padding using spacing tokens; defaults to `'lg'`. */
  padding?: SpacingSize;
  /** If true, removes the 1px border. Defaults to `false`. */
  noBorder?: boolean;
}

/**
 * Card
 *
 * A lightweight surface with rounded corners and optional border.
 * Uses design tokens for background, spacing, and border color.
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'lg',
  noBorder = false,
}) => {
  return (
    <View
      style={[styles.container, { padding: Spacing[padding] }, !noBorder && styles.border, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  /** Base container surface. */
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
  } as ViewStyle,
  /** Optional subtle border for separation on similar backgrounds. */
  border: {
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,
});
