// ============================================
// components/common/RefreshableScrollView.tsx
// ============================================
import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  ScrollViewProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../styles/colors';

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  onRefresh,
  children,
  style,
  ...props
}) => {
  const [refreshing, setRefreshing] = useState(false);

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
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
});
