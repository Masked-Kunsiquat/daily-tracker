// ============================================
// components/daily-entry/DynamicListSection.tsx
// ============================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, TextInput, Button, IconButton } from '../common';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { Spacing } from '../../styles/spacing';

interface DynamicListSectionProps {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
}

/**
 * A reusable section for lists where users can add or remove text inputs.
 */
export const DynamicListSection: React.FC<DynamicListSectionProps> = ({
  title,
  items,
  setItems,
  placeholder,
}) => {
  const handleAddItem = () => {
    setItems([...items, '']);
  };

  const handleUpdateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.listItemContainer}>
          <TextInput
            style={styles.listInput}
            value={item}
            onChangeText={(text) => handleUpdateItem(index, text)}
            placeholder={placeholder}
            multiline
          />
          {items.length > 1 && (
            <IconButton
              icon="✕"
              onPress={() => handleRemoveItem(index)}
              color={Colors.danger}
              style={styles.removeButton}
            />
          )}
        </View>
      ))}
      <Button
        title="+ Add another"
        variant="ghost"
        onPress={handleAddItem}
        style={styles.addButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  listInput: {
    flex: 1,
  },
  removeButton: {
    marginLeft: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
});