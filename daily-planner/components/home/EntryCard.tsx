// ============================================
// components/home/EntryCard.tsx
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Link } from 'expo-router';
import { DailyEntry } from '../../lib/database';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { Spacing } from '../../styles/spacing';
import { getRatingColor } from '../../utils/ratingHelpers';
import { formatEntryDate } from '../../utils/dateHelpers';
import { getEntryPreview } from '../../utils/textHelpers';

interface EntryCardProps {
  entry: DailyEntry;
  todayISO: string;
}

export const EntryCard: React.FC<EntryCardProps> = React.memo(({ entry, todayISO }) => {
  return (
    <Link
      href={{
        pathname: '/daily-entry',
        params: { date: entry.date },
      }}
      asChild
    >
      <TouchableOpacity style={styles.container} accessibilityRole="button">
        <View style={styles.header}>
          <Text style={styles.date}>{formatEntryDate(entry.date, todayISO)}</Text>
          <RatingDots ratings={entry.ratings} />
        </View>
        <Text style={styles.preview}>{getEntryPreview(entry)}</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            ✅ {entry.accomplishments.length} • 📚 {entry.things_learned.length} • 🙏 {entry.things_grateful.length}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
});

EntryCard.displayName = 'EntryCard';

const RatingDots: React.FC<{ ratings: DailyEntry['ratings'] }> = ({ ratings }) => (
  <View style={styles.ratingDots} accessible accessibilityLabel="Ratings">
    <View style={[styles.dot, { backgroundColor: getRatingColor(ratings.productivity) }]} />
    <View style={[styles.dot, styles.dotSpacing, { backgroundColor: getRatingColor(ratings.mood) }]} />
    <View style={[styles.dot, styles.dotSpacing, { backgroundColor: getRatingColor(ratings.energy) }]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  } as ViewStyle,
  date: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  } as TextStyle,
  ratingDots: {
    flexDirection: 'row',
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  dotSpacing: {
    marginLeft: 4,
  } as ViewStyle,
  preview: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
    marginBottom: Spacing.sm,
  } as TextStyle,
  stats: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  } as ViewStyle,
  statText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  } as TextStyle,
});