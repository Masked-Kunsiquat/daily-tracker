// components/daily-entry/DynamicListSection.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, TextInput, Button, IconButton } from '../common';
import { Colors } from '@/styles/colors';
import { Typography } from '@/styles/typography';
import { Spacing } from '@/styles/spacing';

/**
 * Internal item model with a stable ID to prevent input remounts
 * (keeps caret position and avoids losing focus on changes).
 */
interface ListItem {
  id: string;
  value: string;
}

/**
 * Props for {@link DynamicListSection}.
 *
 * `items`/`setItems` are controlled externally as a `string[]`;
 * this component maintains an internal `ListItem[]` with stable IDs
 * and keeps both in sync.
 */
interface DynamicListSectionProps {
  /** Section heading displayed above the inputs. */
  title: string;
  /** Controlled list of strings from the parent. */
  items: string[];
  /** Setter for the controlled list of strings. */
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  /** Placeholder text for each input row. */
  placeholder: string;
}

/**
 * Generate a unique ID for new list items.
 * Uses a closure-based counter + timestamp to minimize collision risk.
 */
const generateId = (() => {
  let counter = 0;
  return () => `item_${Date.now()}_${++counter}`;
})();

/**
 * DynamicListSection
 *
 * A reusable list section allowing users to add/remove multi-line text inputs.
 * - Uses stable IDs to avoid remounting inputs when editing (better UX).
 * - Reconciles incoming `items` from the parent with existing internal IDs.
 * - Syncs edits/removals/additions back to the parent as a `string[]`.
 */
export const DynamicListSection: React.FC<DynamicListSectionProps> = ({
  title,
  items,
  setItems,
  placeholder,
}) => {
  // Internal state with stable IDs
  const [internalItems, setInternalItems] = useState<ListItem[]>([]);

  /**
   * Reconcile incoming `items` with current `internalItems` to:
   * - Preserve IDs for values that still exist (prevents input remounts)
   * - Generate IDs for new values or duplicates
   *
   * Implementation detail:
   * Build an occurrence-aware map of value -> [ids...] so duplicates
   * retain distinct, stable IDs in order.
   */
  useEffect(() => {
    // Build occurrence-aware map value -> [ids...] to keep duplicates stable.
    const valueToIds = new Map<string, string[]>();
    for (const { id, value } of internalItems) {
      const arr = valueToIds.get(value) ?? [];
      arr.push(id);
      valueToIds.set(value, arr);
    }

    const reconciled: ListItem[] = items.map((value) => {
      const arr = valueToIds.get(value);
      if (arr && arr.length) {
        return { id: arr.shift() as string, value };
      }
      return { id: generateId(), value };
    });

    // Shallow equality check to avoid unnecessary re-render
    const equal =
      reconciled.length === internalItems.length &&
      reconciled.every(
        (it, i) => it.id === internalItems[i].id && it.value === internalItems[i].value,
      );

    if (!equal) {
      setInternalItems(reconciled);
    }
    // Only react to prop changes; internalItems is read for reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /**
   * Push internal changes back up to the parent as `string[]`.
   */
  const syncToParent = (newInternalItems: ListItem[]) => {
    const stringArray = newInternalItems.map((item) => item.value);
    setItems(stringArray);
  };

  /** Add a new empty row. */
  const handleAddItem = () => {
    setInternalItems((prev) => {
      const newItems = [...prev, { id: generateId(), value: '' }];
      syncToParent(newItems);
      return newItems;
    });
  };

  /** Update a specific row by ID. */
  const handleUpdateItem = (id: string, value: string) => {
    setInternalItems((prev) => {
      const newItems = prev.map((item) => (item.id === id ? { ...item, value } : item));
      syncToParent(newItems);
      return newItems;
    });
  };

  /** Remove a row by ID (keeps at least one input present). */
  const handleRemoveItem = (id: string) => {
    if (internalItems.length > 1) {
      setInternalItems((prev) => {
        const newItems = prev.filter((item) => item.id !== id);
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
