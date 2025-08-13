// screens/SummariesScreen.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  RefreshableScrollView,
  Card,
  Badge,
} from '../components/common'; 
import { Colors } from '../styles/colors';
import { Typography } from '../styles/typography';
import { Spacing } from '../styles/spacing';

export default function SummariesScreen() {
  const summaryTypes = [
    { title: 'Weekly Summaries', description: 'Last 4 weeks', count: 0 },
    { title: 'Monthly Summaries', description: 'Last 6 months', count: 0 },
    { title: 'Yearly Summaries', description: 'Previous years', count: 0 },
  ];
  
  // A placeholder function for the pull-to-refresh functionality.
  // You can replace this with your actual data fetching logic.
  const onRefresh = useCallback(async () => {
    console.log('Refreshing summaries...');
    // Simulate a network request
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, []);

  return (
    <RefreshableScrollView
      style={styles.container}
      onRefresh={onRefresh}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered insights from your daily entries
        </Text>
      </View>

      {summaryTypes.map((type, index) => (
        <TouchableOpacity key={index} activeOpacity={0.8}>
          <Card style={styles.summaryCard}>
            <View style={styles.cardContent}>
              <View>
                <Text style={styles.cardTitle}>{type.title}</Text>
                <Text style={styles.cardDescription}>{type.description}</Text>
              </View>
              <Badge label={String(type.count)} variant="primary" size="medium" />
            </View>
            <Text style={styles.arrow}>›</Text>
          </Card>
        </TouchableOpacity>
      ))}

      <Card style={styles.comingSoonCard} noBorder>
        <Text style={styles.comingSoonTitle}>🤖 Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          AI-powered summaries will analyze your daily entries to provide insights about:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Patterns in your productivity and mood</Text>
          <Text style={styles.featureItem}>• Your biggest accomplishments over time</Text>
          <Text style={styles.featureItem}>• Key learnings and growth areas</Text>
          <Text style={styles.featureItem}>• Trends in what you're grateful for</Text>
        </View>
      </Card>
    </RefreshableScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    // The Card component handles background, border, and padding.
    // We add flex direction here to align the arrow.
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: Colors.textMuted,
    marginLeft: Spacing.md,
  },
  comingSoonCard: {
    // A custom style for this specific card, demonstrating flexibility.
    backgroundColor: '#f0f8ff', // A light blue, could be added to Colors as `infoLight`
    padding: Spacing.xl,
  },
  comingSoonTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    marginBottom: Spacing.lg,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  },
  featureList: {
    marginLeft: Spacing.sm,
  },
  featureItem: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
});