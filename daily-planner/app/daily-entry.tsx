import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { databaseService, DailyEntry } from '../lib/database';

// Import our reusable components
import {
  RefreshableScrollView,
  LoadingScreen,
  Card,
  TextInput,
  Button,
  IconButton,
  Separator,
} from '../components/common';
import { Colors } from '../styles/colors';
import { Typography } from '../styles/typography';
import { Spacing } from '../styles/spacing';

// TYPES
type RatingCategory = 'productivity' | 'mood' | 'energy';

// =================================================================
// SUB-COMPONENTS
// =================================================================

// Props for the dynamic list section
interface DynamicListSectionProps {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
}

/**
 * A reusable section for lists where users can add or remove text inputs.
 */
const DynamicListSection: React.FC<DynamicListSectionProps> = ({
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

// Props for the ratings section
interface RatingsSectionProps {
  ratings: Record<RatingCategory, number>;
  setRatings: React.Dispatch<React.SetStateAction<Record<RatingCategory, number>>>;
}

/**
 * A section for users to rate different categories using stars.
 */
const RatingsSection: React.FC<RatingsSectionProps> = ({ ratings, setRatings }) => {
  const renderStarRating = (category: RatingCategory) => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setRatings({ ...ratings, [category]: star })}
          activeOpacity={0.7}
        >
          <Text style={[styles.star, star <= ratings[category] ? styles.starFilled : {}]}>
            ⭐
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Daily Ratings</Text>
      <View style={styles.ratingItem}>
        <Text style={styles.ratingLabel}>Productivity</Text>
        {renderStarRating('productivity')}
      </View>
      <Separator />
      <View style={styles.ratingItem}>
        <Text style={styles.ratingLabel}>Mood</Text>
        {renderStarRating('mood')}
      </View>
      <Separator />
      <View style={styles.ratingItem}>
        <Text style={styles.ratingLabel}>Energy</Text>
        {renderStarRating('energy')}
      </View>
    </Card>
  );
};

// =================================================================
// MAIN SCREEN COMPONENT
// =================================================================

export default function DailyEntryScreen() {
  const { date: paramDate } = useLocalSearchParams();
  const entryDate = (paramDate as string) || new Date().toISOString().split('T')[0];
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyText, setDailyText] = useState('');
  const [accomplishments, setAccomplishments] = useState(['']);
  const [thingsLearned, setThingsLearned] = useState(['']);
  const [thingsGrateful, setThingsGrateful] = useState(['']);
  const [ratings, setRatings] = useState<Record<RatingCategory, number>>({
    productivity: 3,
    mood: 3,
    energy: 3,
  });

  // Data loading
  const loadExistingEntry = useCallback(async () => {
    try {
      await databaseService.initialize();
      const existingEntry = await databaseService.getDailyEntry(entryDate);
      
      if (existingEntry) {
        setDailyText(existingEntry.daily_text);
        setAccomplishments(existingEntry.accomplishments.length > 0 ? existingEntry.accomplishments : ['']);
        setThingsLearned(existingEntry.things_learned.length > 0 ? existingEntry.things_learned : ['']);
        setThingsGrateful(existingEntry.things_grateful.length > 0 ? existingEntry.things_grateful : ['']);
        setRatings(existingEntry.ratings);
      }
    } catch (error) {
      console.error('Error loading existing entry:', error);
      Alert.alert('Error', 'Failed to load existing entry');
    } finally {
      setLoading(false);
    }
  }, [entryDate]);
  
  useEffect(() => {
    loadExistingEntry();
  }, [loadExistingEntry]);
  
  // Data saving
  const saveEntry = async () => {
    setSaving(true);
    try {
      const entry: DailyEntry = {
        date: entryDate,
        daily_text: dailyText,
        accomplishments: accomplishments.filter(item => item.trim() !== ''),
        things_learned: thingsLearned.filter(item => item.trim() !== ''),
        things_grateful: thingsGrateful.filter(item => item.trim() !== ''),
        ratings,
      };

      await databaseService.saveDailyEntry(entry);
      
      Alert.alert('Entry Saved!', 'Your daily entry has been saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render Logic
  if (loading) {
    return <LoadingScreen message="Loading entry..." />;
  }

  const formattedDate = new Date(entryDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <>
      <RefreshableScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        onRefresh={loadExistingEntry}
      >
        <Text style={styles.dateHeader}>{formattedDate}</Text>

        <Card style={styles.card}>
          <TextInput
            label="Daily Reflection"
            value={dailyText}
            onChangeText={setDailyText}
            placeholder="How was your day? What happened?"
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />
        </Card>

        <DynamicListSection
          title="Accomplishments"
          items={accomplishments}
          setItems={setAccomplishments}
          placeholder="e.g., Finished a project"
        />

        <DynamicListSection
          title="Things I Learned"
          items={thingsLearned}
          setItems={setThingsLearned}
          placeholder="e.g., A new shortcut in my code editor"
        />

        <DynamicListSection
          title="Things I'm Grateful For"
          items={thingsGrateful}
          setItems={setThingsGrateful}
          placeholder="e.g., A sunny afternoon"
        />
        
        <RatingsSection ratings={ratings} setRatings={setRatings} />

      </RefreshableScrollView>
      <View style={styles.footer}>
        <Button
          title="Save Entry"
          onPress={saveEntry}
          loading={saving}
          fullWidth
          style={styles.saveButton}
        />
      </View>
    </>
  );
}

// =================================================================
// STYLESHEET
// =================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  dateHeader: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
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
    marginTop: Spacing.sm, // Align with text input padding
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  ratingLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text,
    flex: 1,
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 28,
    marginHorizontal: Spacing.xs,
    opacity: 0.3,
  },
  starFilled: {
    opacity: 1,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.success, // Custom color for save action
  },
});