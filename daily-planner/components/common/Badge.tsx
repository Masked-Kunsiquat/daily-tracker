// components/common/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * All supported visual variants for the Badge component.
 * Keep this list tight so design tokens stay consistent app-wide.
 */
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Derived size union from props. Useful for typing size-based style maps.
 * (If you add a new size to `BadgeProps['size']`, the maps below must compile-time update.)
 */
type BadgeSize = NonNullable<BadgeProps['size']>;

/**
 * Props for {@link Badge}.
 */
interface BadgeProps {
  /** Required text content. Kept to a single line; long text is truncated. */
  label: string;
  /** Visual style; defaults to `'primary'`. */
  variant?: BadgeVariant;
  /** Component size; defaults to `'small'`. */
  size?: 'small' | 'medium';
  /** Optional container style override. */
  style?: StyleProp<ViewStyle>;
  /** Optional text style override. */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Badge
 *
 * A small, rounded status/metadata pill used to annotate UI elements.
 * - Variants map to theme tokens (primary/success/warning/danger/info/neutral)
 * - Sizes: `small` | `medium`
 *
 * Accessibility:
 * - Container is purely visual; `Text` carries the accessible name so it's read once.
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'small',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.container, variantStyles[variant], sizeStyles[size], style]}>
      {/* Move accessibility to Text to avoid duplicate announcements */}
      <Text
        accessibilityRole="text"
        accessibilityLabel={label}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.text,
          textSizeStyles[size],
          variant === 'neutral' && styles.neutralText,
          textStyle,
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  /** Base container styles applied to all variants/sizes. */
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Base text styles; color may be overridden for specific variants. */
  text: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
  },
  /** Better contrast when the background is muted/neutral. */
  neutralText: {
    color: Colors.text,
  },
});

/**
 * Strongly-typed variant style map.
 * Every {@link BadgeVariant} key must exist; extras are disallowed at compile time.
 */
type VariantStyleMap = { [K in BadgeVariant]: ViewStyle };
const variantStyles = StyleSheet.create<VariantStyleMap>({
  primary: { backgroundColor: Colors.primary },
  success: { backgroundColor: Colors.success },
  warning: { backgroundColor: Colors.warning },
  danger: { backgroundColor: Colors.danger },
  info: { backgroundColor: Colors.info },
  neutral: { backgroundColor: Colors.textMuted },
});

/**
 * Strongly-typed size style map keyed by {@link BadgeSize}.
 * Controls horizontal/vertical padding and a sane minWidth for readability.
 */
type SizeStyleMap = { [K in BadgeSize]: ViewStyle };
const sizeStyles = StyleSheet.create<SizeStyleMap>({
  small: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs, // use token instead of magic number
    minWidth: 24,
  },
  medium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 32,
  },
});

/** Text-size adjustments aligned with {@link sizeStyles}. */
const textSizeStyles = StyleSheet.create({
  small: { fontSize: Typography.sizes.xs },
  medium: { fontSize: Typography.sizes.sm },
});
