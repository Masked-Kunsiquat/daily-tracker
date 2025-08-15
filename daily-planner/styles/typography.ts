// styles/typography.ts

/**
 * Typography design tokens for **React Native**.
 *
 * - `sizes`: font sizes in **pixels** (number).
 * - `weights`: string numeric values (RN-compatible) for fontWeight.
 * - `lineHeights`: relative multipliers used to compute line height (e.g., `fontSize * 1.5`).
 *
 * Usage:
 * ```tsx
 * const styles = StyleSheet.create({
 *   title: {
 *     fontSize: Typography.sizes.xl,
 *     fontWeight: Typography.weights.semibold,
 *     lineHeight: Typography.sizes.xl * Typography.lineHeights.normal,
 *   },
 *   caption: {
 *     fontSize: Typography.sizes.sm,
 *     color: Colors.textSecondary,
 *     lineHeight: Typography.sizes.sm * Typography.lineHeights.tight,
 *   },
 * });
 * ```
 *
 * Notes:
 * - Keep sizes consistent across the app; prefer tokens over magic numbers.
 * - Weights use string values (`'400'`, `'500'`, ...) because RN accepts both keywords and string numerics.
 * - Choose a `lineHeights` multiplier that matches the density of the surrounding UI.
 */
export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    title: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
