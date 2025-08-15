// components/common/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * Props for {@link ErrorBoundary}.
 */
interface Props {
  /** Children to protect with the boundary. */
  children: ReactNode;
  /**
   * Optional custom fallback renderer.
   * Receives the thrown `error` and a `resetError()` callback to clear the boundary state.
   * If omitted, a built-in fallback UI is shown.
   */
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

/**
 * Internal state for {@link ErrorBoundary}.
 */
interface State {
  /** Whether a descendant error has been captured. */
  hasError: boolean;
  /** The captured error instance (if any). */
  error: Error | null;
}

/**
 * ErrorBoundary
 *
 * Catches rendering errors in its child tree and renders either a custom
 * `fallback` (if provided) or a built-in friendly UI with a "Try Again" button.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary
 *   fallback={(err, reset) => (
 *     <MyFallback error={err} onRetry={reset} />
 *   )}
 * >
 *   <ProblematicTree />
 * </ErrorBoundary>
 * ```
 *
 * Notes:
 * - `resetError()` sets state back to the healthy path so children re-render.
 * - In development, the built-in fallback shows error details under `__DEV__`.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Lifecycle hook invoked after an error is thrown in a descendant.
   * Sets the error state to trigger fallback rendering.
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Lifecycle hook for logging/side-effects when an error is caught.
   * Avoids user-facing mutations; use for telemetry.
   */
  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Clears the error state so children are re-rendered.
   * Useful for "Try Again" flows when the error cause may be transient.
   */
  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * Renders either:
   * - Custom fallback (if provided), or
   * - Built-in fallback with optional dev-only details and a retry button, or
   * - The happy-path children when no error is present.
   */
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We&apos;re sorry for the inconvenience. Please try restarting the app.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  /** Fullscreen container for the fallback UI. */
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  } as ViewStyle,
  /** Centers fallback content with comfortable padding. */
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  } as ViewStyle,
  /** Friendly emoji to soften the error state. */
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  } as TextStyle,
  /** Prominent error headline. */
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  } as TextStyle,
  /** Supportive copy with readable line height. */
  message: {
    fontSize: Typography.sizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
  } as TextStyle,
  /** Dev-only error container for quick inspection. */
  errorDetails: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.xl,
    maxWidth: '100%',
  } as ViewStyle,
  /** Label for the dev-only error section. */
  errorTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.danger,
    marginBottom: Spacing.xs,
  } as TextStyle,
  /** Monospace error text. */
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  } as TextStyle,
  /** Primary retry button styling. */
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  } as ViewStyle,
  /** Retry label styling. */
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  } as TextStyle,
});
