// components/common/RefreshableScrollView.tsx
import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, ScrollViewProps, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/styles/colors';

/**
 * Props for {@link RefreshableScrollView}.
 */
interface RefreshableScrollViewProps extends ScrollViewProps {
  /**
   * Async refresh handler invoked by pull-to-refresh.
   * Must resolve a Promise; errors are not surfaced to the control.
   */
  onRefresh: () => Promise<void>;
  /** Scroll content. */
  children: React.ReactNode;
}

/**
 * RefreshableScrollView
 *
 * ScrollView with built-in pull-to-refresh via `RefreshControl`.
 * - Shows spinner while `onRefresh` is pending
 * - Always stops the spinner (finally block), even if the handler throws
 * - Passes through all standard `ScrollViewProps`
 */
export const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  onRefresh,
  children,
  style,
  ...props
}) => {
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Wraps the caller's `onRefresh` to manage `refreshing` state
   * and guarantee spinner cleanup.
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      style={[styles.container, style]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}      // iOS spinner color
          colors={[Colors.primary]}        // Android spinner colors
        />
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  /** Base background to match app theme. */
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
});
