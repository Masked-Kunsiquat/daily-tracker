// ============================================
// components/common/TextInput.tsx
// ============================================
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

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, helper, style, ...props }, ref) => {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor={Colors.placeholder}
          {...props}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {helper && !error && <Text style={styles.helper}>{helper}</Text>}
      </View>
    );
  }
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