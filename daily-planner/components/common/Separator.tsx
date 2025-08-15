// components/common/Separator.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';
import { Spacing } from '@/styles/spacing';

/**
 * Props for {@link Separator}.
 */
interface SeparatorProps {
  /** Vertical margin above/below the rule; uses spacing tokens. Defaults to `'md'`. */
  spacing?: keyof typeof Spacing;
  /** Line color; defaults to theme borderLight. */
  color?: string;
}

/**
 * Separator
 *
 * A simple 1px horizontal rule used to divide content.
 * Spacing is applied vertically via the `spacing` token.
 */
export const Separator: React.FC<SeparatorProps> = ({
  spacing = 'md',
  color = Colors.borderLight,
}) => {
  return (
    <View
      style={[
        styles.separator,
        {
          marginVertical: Spacing[spacing],
          backgroundColor: color,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  /** 1px full-width line. */
  separator: {
    height: 1,
    width: '100%',
  },
});
