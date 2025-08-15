// components/common/IconButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { Colors } from '@/styles/colors';

/**
 * Props for {@link IconButton}.
 * Extends {@link TouchableOpacityProps} so you can pass any standard touchable props.
 */
interface IconButtonProps extends TouchableOpacityProps {
  /** Emoji or glyph string to render (e.g., '✏️', '🔍'). */
  icon: string;
  /** Control the button and icon size; defaults to `'medium'`. */
  size?: 'small' | 'medium' | 'large';
  /** Icon color; defaults to theme text color. */
  color?: string;
  /** Optional visible label for context (not rendered automatically). */
  label?: string;
}

/**
 * IconButton
 *
 * A minimal, circular touch target that renders a single emoji/glyph as its icon.
 *
 * Behavior & Accessibility:
 * - Defaults `accessibilityRole` to `'button'`.
 * - Uses `accessibilityLabel` if provided; otherwise falls back to `label` or
 *   a generated label like `"<icon> button"`.
 * - Applies a default `hitSlop` (10px each side) to meet tap target guidelines.
 *
 * Notes:
 * - This component only renders the icon; if you need a visible text label, place it alongside.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'medium',
  color = Colors.text,
  label,
  style,
  accessibilityLabel,
  accessibilityRole,
  hitSlop,
  ...props
}) => {
  // Default accessibility label: use provided label, explicit accessibilityLabel, or fallback
  const defaultAccessibilityLabel = accessibilityLabel || label || `${icon} button`;

  // Default hit slop for better touch targets
  const defaultHitSlop = hitSlop || {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  };

  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles[size], style]}
      activeOpacity={0.7}
      accessibilityRole={accessibilityRole || 'button'}
      accessibilityLabel={defaultAccessibilityLabel}
      hitSlop={defaultHitSlop}
      {...props}>
      <Text style={[iconSizeStyles[size], { color }]}>{icon}</Text>
    </TouchableOpacity>
  );
};

/** Base container—kept circular and centered. */
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

/** Button dimensions by size. */
const sizeStyles = StyleSheet.create({
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 40,
    height: 40,
  },
  large: {
    width: 48,
    height: 48,
  },
});

/** Icon font sizes by size. */
const iconSizeStyles = StyleSheet.create({
  small: {
    fontSize: 16,
  },
  medium: {
    fontSize: 20,
  },
  large: {
    fontSize: 24,
  },
});
