// ============================================
// components/common/LoadingScreen.tsx
// ============================================
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { Spacing } from '../../styles/spacing';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

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
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  } as ViewStyle,
  fullScreen: {
    flex: 1,
  } as ViewStyle,
  inline: {
    padding: Spacing.xl,
  } as ViewStyle,
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
  } as TextStyle,
});
