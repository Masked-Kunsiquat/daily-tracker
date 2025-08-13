// ============================================
// utils/ratingHelpers.ts
// ============================================
import { Colors } from '../styles/colors';

export const getRatingColor = (rating: number): string => {
  if (rating >= 4) return Colors.ratingHigh;
  if (rating >= 3) return Colors.ratingMedium;
  return Colors.ratingLow;
};

export const getRatingLabel = (rating: number): string => {
  if (rating >= 4) return 'Great';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Okay';
  return 'Poor';
};