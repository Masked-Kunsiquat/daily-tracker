// styles/spacing.ts

/**
 * Design spacing scale in **pixels**.
 *
 * One source of truth for paddings/margins/gaps. Use these tokens instead of magic numbers
 * so layouts stay consistent and are easy to tweak globally.
 *
 * Example:
 * ```tsx
 * <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.sm }} />
 * ```
 *
 * Notes:
 * - Keep this scale tight. If you find yourself needing new steps often, reconsider layout first.
 * - `as const` preserves literal types for better autocomplete and type safety.
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Union of valid spacing token names (e.g., `'sm' | 'md' | 'lg'`).
 * Useful for component props that accept spacing keys.
 */
export type SpacingSize = keyof typeof Spacing;
