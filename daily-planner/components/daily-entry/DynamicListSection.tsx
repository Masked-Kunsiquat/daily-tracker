// ============================================
// components/daily-entry/DynamicListSection.tsx
// ============================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, TextInput, Button, IconButton } from '../common';
import { Colors } from '../../styles/colors';
import { Typography } from '../../styles/typography';
import { Spacing } from '../../styles/spacing';

interface ListItem {
  id: string;
  value: string;
}

interface DynamicListSectionProps {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
}

// Generate unique ID for new items
const generateId = (() => {
  let counter = 0;
  return () => `item_${Date.now()}_${++counter}`;
})();

/**
 * A reusable section for lists where users can add or remove text inputs.
 */
export const DynamicListSection: React.FC<DynamicListSectionProps> = ({
  title,
  items,
  setItems,
  placeholder,
}) => {
  // Internal state with stable IDs
  const [internalItems, setInternalItems] = useState<ListItem[]>([]);

  // Convert incoming string[] to internal format on mount and when items change
  useEffect(() => {
    const itemsWithIds = items.map((value, index) => ({
      id: `existing_${index}_${value.slice(0, 10)}`, // Use content snippet for some stability
      value,
    }));
    setInternalItems(itemsWithIds);
  }, [items]);

  // Sync internal changes back to parent as string[]
  const syncToParent = (newInternalItems: ListItem[]) => {
    const stringArray = newInternalItems.map(item => item.value);
    setItems(stringArray);
  };

  const handleAddItem = () => {
    setInternalItems(prev => {
      const newItems = [...prev, { id: generateId(), value: '' }];
      syncToParent(newItems);
      return newItems;
    });
  };

  const handleUpdateItem = (id: string, value: string) => {
    setInternalItems(prev => {
      const newItems = prev.map(item =>
        item.id === id ? { ...item, value } : item
      );
      syncToParent(newItems);
      return newItems;
    });
  };

  const handleRemoveItem = (id: string) => {
    if (internalItems.length > 1) {
      setInternalItems(prev => {
        const newItems = prev.filter(item => item.id !== id);
        syncToParent(newItems);
        return newItems;
      });
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {internalItems.map((item) => (
        <View key={item.id} style={styles.listItemContainer}>
          <TextInput
            style={styles.listInput}
            value={item.value}
            onChangeText={(text) => handleUpdateItem(item.id, text)}
            placeholder={placeholder}
            multiline
          />
          {internalItems.length > 1 && (
            <IconButton
              icon="✕"
              onPress={() => handleRemoveItem(item.id)}
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