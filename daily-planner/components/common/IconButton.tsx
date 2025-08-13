// ============================================
// components/common/IconButton.tsx
// ============================================
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '@/styles/colors';
import { Spacing } from '@/styles/spacing';

interface IconButtonProps extends TouchableOpacityProps {
  icon: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'medium',
  color = Colors.text,
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, sizeStyles[size], style]}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[iconSizeStyles[size], { color }]}>{icon}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});

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