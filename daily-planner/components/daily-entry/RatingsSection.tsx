// components/daily-entry/RatingsSection.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityActionEvent } from 'react-native';
import { Card, Separator } from '../common';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/** Valid rating categories captured in this section. */
type RatingCategory = 'productivity' | 'mood' | 'energy';

/**
 * Props for {@link RatingsSection}.
 */
interface RatingsSectionProps {
  /** Current 1–5 ratings keyed by category. */
  ratings: Record<RatingCategory, number>;
  /** Setter to update the ratings object. */
  setRatings: React.Dispatch<React.SetStateAction<Record<RatingCategory, number>>>;
}

/**
 * RatingsSection
 *
 * Star-based (1–5) rating inputs for productivity, mood, and energy.
 * - Taps set the selected star value
 * - Fully accessible via screen readers with `adjustable` role and increment/decrement actions
 */
export const RatingsSection: React.FC<RatingsSectionProps> = ({ ratings, setRatings }) => {
  /** Update a single category rating. */
  const updateRating = (category: RatingCategory, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  /**
   * Handle a11y increment/decrement actions for star groups.
   * Clamps to the 1–5 range.
   */
  const handleAccessibilityAction = (category: RatingCategory, event: AccessibilityActionEvent) => {
    const currentRating = ratings[category];

    switch (event.nativeEvent.actionName) {
      case 'increment':
        if (currentRating < 5) {
          updateRating(category, currentRating + 1);
        }
        break;
      case 'decrement':
        if (currentRating > 1) {
          updateRating(category, currentRating - 1);
        }
        break;
    }
  };

  /**
   * Render five tappable stars for a category, with accessible semantics.
   */
  const renderStarRating = (category: RatingCategory) => {
    const currentRating = ratings[category];
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => updateRating(category, star)}
            activeOpacity={0.7}
            accessibilityRole="adjustable"
            accessibilityLabel={`${categoryLabel} rating`}
            accessibilityValue={{
              min: 1,
              max: 5,
              now: currentRating,
              text: `${currentRating} out of 5 stars`,
            }}
            onAccessibilityAction={(event) => handleAccessibilityAction(category, event)}
            accessibilityActions={[
              { name: 'increment', label: 'Increase rating' },
              { name: 'decrement', label: 'Decrease rating' },
            ]}
          >
            <Text style={[styles.star, star <= currentRating ? styles.starFilled : {}]}>⭐</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Daily Ratings</Text>
      <View style={styles.ratingItem}>
        <Text style={styles.ratingLabel}>Productivity</Text>
        {renderStarRating('productivity')}
      </View>
      <Separator />
      <View style={styles.ratingItem}>
        <Text style={styles.ratingLabel}>Mood</Text>
        {renderStarRating('mood')}
      </View>
      <Separator />
      <View style={styles.ratingItem}>
        <Text style={styles.ratingLabel}>Energy</Text>
        {renderStarRating('energy')}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  ratingLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    flex: 1,
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 28,
    marginHorizontal: Spacing.xs,
    opacity: 0.3,
  },
  starFilled: {
    opacity: 1,
  },
});
