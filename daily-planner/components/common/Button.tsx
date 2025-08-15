// components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * Visual variants supported by the Button component.
 * Keep in sync with design tokens.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

/**
 * Predefined sizing options controlling padding and text size.
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for {@link Button}.
 * Extends React Native's {@link TouchableOpacityProps}, so any touchable prop
 * (e.g., `onPress`, `accessibilityLabel`) can be passed through.
 */
interface ButtonProps extends TouchableOpacityProps {
  /** Visible label text. */
  title: string;
  /** Visual style; defaults to `'primary'`. */
  variant?: ButtonVariant;
  /** Padding/text scale; defaults to `'medium'`. */
  size?: ButtonSize;
  /** When true, shows a spinner and disables interactions. */
  loading?: boolean;
  /** Optional leading icon element. Rendered left of the label. */
  icon?: React.ReactNode;
  /** If true, the button expands to the container width. */
  fullWidth?: boolean;
}

/**
 * Button
 *
 * A theme-aware, accessible button with variants, sizes, loading state,
 * optional leading icon, and full-width mode.
 *
 * Behavior:
 * - `loading` shows an `ActivityIndicator` and disables presses.
 * - `disabled` (from TouchableOpacityProps) also disables presses; combined with
 *   `loading` via `isDisabled`.
 * - For non-primary variants, the spinner color uses `Colors.primary` for contrast.
 *
 * Accessibility:
 * - Inherit/override typical touchable a11y props via `...props`.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  style,
  ...props
}) => {
  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    sizeStyles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    textBaseStyles.base,
    textVariantStyles[variant],
    textSizeStyles[size],
    disabled && textBaseStyles.disabled,
  ].filter(Boolean) as TextStyle[];

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity style={buttonStyles} disabled={isDisabled} activeOpacity={0.7} {...props}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.textInverse : Colors.primary}
        />
      ) : (
        <>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  /** Base container styles shared by all variants/sizes. */
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  } as ViewStyle,

  /** Filled primary button. */
  primary: {
    backgroundColor: Colors.primary,
  } as ViewStyle,

  /** Low-emphasis filled button with border. */
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,

  /** Destructive action button. */
  danger: {
    backgroundColor: Colors.danger,
  } as ViewStyle,

  /** Text-only button with no background. */
  ghost: {
    backgroundColor: 'transparent',
  } as ViewStyle,

  /** Transparent background with themed outline. */
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  } as ViewStyle,

  /** Expands to full container width. */
  fullWidth: {
    width: '100%',
  } as ViewStyle,

  /** Visual hint for disabled state; interaction is also blocked via prop. */
  disabled: {
    opacity: 0.5,
  } as ViewStyle,

  /** Spacing between optional icon and label. */
  icon: {
    marginRight: Spacing.sm,
  } as ViewStyle,
});

/** Padding blocks keyed by {@link ButtonSize}. */
const sizeStyles = StyleSheet.create({
  small: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  } as ViewStyle,
  medium: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  large: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  } as ViewStyle,
});

/** Base text styling; variant/size layers add color and scale. */
const textBaseStyles = StyleSheet.create({
  base: {
    fontWeight: Typography.weights.semibold,
  } as TextStyle,
  disabled: {
    opacity: 0.7,
  } as TextStyle,
});

/** Color tokens keyed by {@link ButtonVariant}. */
const textVariantStyles = StyleSheet.create({
  primary: {
    color: Colors.textInverse,
  } as TextStyle,
  secondary: {
    color: Colors.text,
  } as TextStyle,
  danger: {
    color: Colors.textInverse,
  } as TextStyle,
  ghost: {
    color: Colors.primary,
  } as TextStyle,
  outline: {
    color: Colors.primary,
  } as TextStyle,
});

/** Font sizing keyed by {@link ButtonSize}. */
const textSizeStyles = StyleSheet.create({
  small: {
    fontSize: Typography.sizes.sm,
  } as TextStyle,
  medium: {
    fontSize: Typography.sizes.md,
  } as TextStyle,
  large: {
    fontSize: Typography.sizes.lg,
  } as TextStyle,
});
