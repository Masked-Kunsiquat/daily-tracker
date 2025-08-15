// components/common/TextInput.tsx
import React, { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * Props for {@link TextInput}.
 * Extends React Native's {@link RNTextInputProps}, so all standard input props
 * (e.g., `value`, `onChangeText`, `keyboardType`) are supported.
 */
interface TextInputProps extends RNTextInputProps {
  /** Optional label rendered above the input. */
  label?: string;
  /** Error message shown below the input (takes precedence over `helper`). */
  error?: string;
  /** Helper/caption text shown when there is no `error`. */
  helper?: string;
}

/**
 * TextInput
 *
 * A themed input with optional label, helper text, and error state.
 * - If `error` is provided, the border color changes and the error message is shown.
 * - If no `error`, an optional `helper` message can provide guidance.
 * - For accessibility, provide `accessibilityLabel` when `label` is not visible.
 *
 * This component forwards its ref to the underlying `RNTextInput`.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, helper, style, ...props }, ref) => {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <RNTextInput
          ref={ref}
          style={[styles.input, error && styles.inputError, style]}
          placeholderTextColor={Colors.placeholder}
          {...props}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {helper && !error && <Text style={styles.helper}>{helper}</Text>}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  helper: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
