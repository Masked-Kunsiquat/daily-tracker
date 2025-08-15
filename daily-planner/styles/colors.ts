// styles/colors.ts

/**
 * Color design tokens for the app's **light theme**.
 *
 * Guidelines:
 * - Always reference these tokens instead of hard-coded values.
 * - Prefer semantic/role-based tokens (`text`, `border`, `success`, etc.) over raw brand colors.
 * - `as const` preserves literal types for strong autocomplete and safety.
 *
 * Example:
 * ```tsx
 * <Text style={{ color: Colors.text }} />
 * <View style={{ backgroundColor: Colors.surface, borderColor: Colors.border }} />
 * <Button style={{ backgroundColor: Colors.primary }} />
 * ```
 */
export const Colors = {
  // Base surfaces
  background: '#ffffff',
  surface: '#f8f9fa',

  // Text
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#888888',
  textInverse: '#ffffff',

  // Borders
  border: '#e9ecef',
  borderLight: '#f0f0f0',

  // Brand
  primary: '#007AFF',
  primaryDark: '#0051D5',

  // Semantic states
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',

  // Special purpose
  overlay: 'rgba(0, 0, 0, 0.5)', // scrims/modals
  disabled: '#C7C7CC',
  placeholder: '#999999',

  // Charts / Ratings (mapped via helpers)
  ratingHigh: '#34C759',
  ratingMedium: '#FF9500',
  ratingLow: '#FF3B30',
} as const;

/**
 * Union of valid color token names (e.g., `'text' | 'primary' | 'border'`).
 */
export type ColorName = keyof typeof Colors;
