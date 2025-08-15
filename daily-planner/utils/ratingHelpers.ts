// utils/ratingHelpers.ts
import { Colors } from '../styles/colors';

/**
 * Map a 1–5 rating to a semantic color token.
 *
 * Thresholds:
 * - >= 4 → `Colors.ratingHigh`
 * - >= 3 → `Colors.ratingMedium`
 * - < 3  → `Colors.ratingLow`
 *
 * Notes:
 * - Values outside 1–5 aren't clamped; anything below 3 falls back to `ratingLow`.
 * - Non-finite/NaN values will also fall through to `ratingLow`.
 *
 * @param rating - Numeric rating (ideally 1..5).
 * @returns Hex color string.
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return Colors.ratingHigh;
  if (rating >= 3) return Colors.ratingMedium;
  return Colors.ratingLow;
};

/**
 * Map a 1–5 rating to a human-friendly label.
 *
 * Thresholds:
 * - >= 4 → "Great"
 * - >= 3 → "Good"
 * - >= 2 → "Okay"
 * - <  2 → "Poor"
 *
 * Notes:
 * - Values outside 1–5 aren't clamped; anything below 2 returns "Poor".
 * - Non-finite/NaN values will also fall through to "Poor".
 *
 * @param rating - Numeric rating (ideally 1..5).
 * @returns Label string describing the rating.
 */
export const getRatingLabel = (rating: number): string => {
  if (rating >= 4) return 'Great';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Okay';
  return 'Poor';
};
