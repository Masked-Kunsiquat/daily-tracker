// components/common/ProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/styles/colors';

/**
 * Props for {@link ProgressBar}.
 */
interface ProgressBarProps {
  /**
   * Progress value from 0 to 1.
   * Non-finite values are coerced to 0; value is clamped to [0, 1].
   */
  progress: number;
  /** Foreground bar color; defaults to theme primary. */
  color?: string;
  /** Track/background color; defaults to a light border color. */
  backgroundColor?: string;
  /** Height of the bar in pixels; defaults to 4. */
  height?: number;
}

/**
 * ProgressBar
 *
 * Simple, themeable horizontal progress indicator.
 * - Clamps progress to [0, 1]
 * - Exposes proper accessibility semantics (`role="progressbar"` with {min, max, now})
 */
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
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 1, now: clampedProgress }}
      style={[styles.container, { backgroundColor, height }]}
    >
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
