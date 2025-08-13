
// ============================================
// components/common/Card.tsx
// ============================================
import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors } from '../../styles/colors';
import { Spacing } from '../../styles/spacing';

export type SpacingSize = keyof typeof Spacing;

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: SpacingSize;
  noBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'lg',
  noBorder = false,
}) => {
  return (
    <View
      style={[
        styles.container,
        { padding: Spacing[padding] },
        !noBorder && styles.border,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
  } as ViewStyle,
  border: {
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,
});