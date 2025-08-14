// ============================================
// components/common/Badge.tsx
// ============================================
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'small',
  style,
  textStyle,
}) => {
  return (
    <View 
      style={[styles.container, variantStyles[variant], sizeStyles[size], style]} 
      accessibilityRole="text" 
      accessibilityLabel={label}
    >
      <Text style={[styles.text, textSizeStyles[size], variant === 'neutral' && styles.neutralText, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.semibold,
  },
  neutralText: {
    color: Colors.text, // better contrast on muted background
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
  },
  success: {
    backgroundColor: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warning,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  info: {
    backgroundColor: Colors.info,
  },
  neutral: {
    backgroundColor: Colors.textMuted,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
  },
  medium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 32,
  },
});

const textSizeStyles = StyleSheet.create({
  small: {
    fontSize: Typography.sizes.xs,
  },
  medium: {
    fontSize: Typography.sizes.sm,
  },
});