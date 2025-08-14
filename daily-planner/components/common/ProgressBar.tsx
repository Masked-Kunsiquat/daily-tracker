// components/common/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = Colors.primary,
  backgroundColor = Colors.borderLight,
  height = 4,
}) => {
  // Coerce to number and validate against NaN/non-finite values
  const p = Number(progress);
  const validProgress = Number.isFinite(p) ? p : 0;

  const clampedProgress = Math.min(Math.max(validProgress, 0), 1);

  return (
    <View
      // Expose progress semantics for screen readers (0..1 scale)
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 1, now: clampedProgress }}
      style={[styles.container, { backgroundColor, height }]}>
      <View
        style={[
          styles.progress,
          {
            backgroundColor: color,
            width: `${clampedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
});
