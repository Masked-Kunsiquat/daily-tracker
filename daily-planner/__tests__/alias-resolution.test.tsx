// __tests__/alias-resolution.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Card } from '@/components/common/Card';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

describe('Alias Resolution Tests', () => {
  test('should resolve @/ alias imports correctly', () => {
    // Test that we can import components using the @/ alias
    expect(Card).toBeDefined();
    expect(Colors).toBeDefined();
    expect(Typography).toBeDefined();
    expect(Spacing).toBeDefined();
  });

  test('Card component renders correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Test Card Content</Text>
      </Card>
    );
    
    expect(getByText('Test Card Content')).toBeTruthy();
  });

  test('Colors object has expected properties', () => {
    expect(Colors.background).toBeDefined();
    expect(Colors.primary).toBeDefined();
    expect(Colors.text).toBeDefined();
  });

  test('Typography object has expected properties', () => {
    expect(Typography.sizes).toBeDefined();
    expect(Typography.weights).toBeDefined();
    expect(Typography.lineHeights).toBeDefined();
  });

  test('Spacing object has expected properties', () => {
    expect(Spacing.xs).toBeDefined();
    expect(Spacing.sm).toBeDefined();
    expect(Spacing.md).toBeDefined();
    expect(Spacing.lg).toBeDefined();
  });
});