// ============================================
// styles/colors.ts
// ============================================
export const Colors = {
  // Base colors
  background: '#ffffff',
  surface: '#f8f9fa',
  
  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#888888',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#e9ecef',
  borderLight: '#f0f0f0',
  
  // Brand colors
  primary: '#007AFF',
  primaryDark: '#0051D5',
  
  // Semantic colors
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  
  // Special purpose
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#C7C7CC',
  placeholder: '#999999',
  
  // Chart/Rating colors
  ratingHigh: '#34C759',
  ratingMedium: '#FF9500',
  ratingLow: '#FF3B30',
} as const;

export type ColorName = keyof typeof Colors;