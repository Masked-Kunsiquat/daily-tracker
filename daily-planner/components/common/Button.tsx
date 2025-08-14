// ============================================
// components/common/Button.tsx
// ============================================
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { Colors } from "../../styles/colors";
import { Typography } from "../../styles/typography";
import { Spacing } from "../../styles/spacing";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "outline";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
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
    <TouchableOpacity
      style={buttonStyles}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? Colors.textInverse : Colors.primary}
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
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  } as ViewStyle,
  primary: {
    backgroundColor: Colors.primary,
  } as ViewStyle,
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,
  danger: {
    backgroundColor: Colors.danger,
  } as ViewStyle,
  ghost: {
    backgroundColor: "transparent",
  } as ViewStyle,
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  } as ViewStyle,
  fullWidth: {
    width: "100%",
  } as ViewStyle,
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
  icon: {
    marginRight: Spacing.sm,
  } as ViewStyle,
});

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

const textBaseStyles = StyleSheet.create({
  base: {
    fontWeight: Typography.weights.semibold,
  } as TextStyle,
  disabled: {
    opacity: 0.7,
  } as TextStyle,
});

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
