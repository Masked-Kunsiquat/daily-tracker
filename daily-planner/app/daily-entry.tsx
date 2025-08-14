// daily-planner/app/daily-entry.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { databaseService, DailyEntry } from '@/lib/database';

// Import reusable components
import {
  RefreshableScrollView,
  LoadingScreen,
  Card,
  TextInput,
  Button,
} from '../components/common';

// Import new modular components
import { DynamicListSection } from '../components/daily-entry/DynamicListSection';
import { RatingsSection } from '../components/daily-entry/RatingsSection';

import { Colors } from '../styles/colors';
import { Typography } from '../styles/typography';
import { Spacing } from '../styles/spacing';

// Local date helper (returns local YYYY-MM-DD)
import { formatDateISO } from '../utils/dateHelpers';

// Helper function to safely normalize the date parameter
const normalizeDateParam = (paramDate: string | string[] | undefined): string => {
  // Handle array case - take first element
  let dateValue = Array.isArray(paramDate) ? paramDate[0] : paramDate;

  // If we have a value, validate it
  if (dateValue) {
    // Check if it matches YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dateValue)) {
      // Additional validation - ensure it's a valid calendar date
      const [y, m, d] = dateValue.split('-').map(Number);
      const test = new Date(y, (m || 1) - 1, d || 1);
      if (
        !isNaN(test.getTime()) &&
        test.getFullYear() === y &&
        test.getMonth() === m - 1 &&
        test.getDate() === d
      ) {
        return dateValue;
      }
    }
  }

  // Fallback to today's LOCAL date (avoid UTC off-by-one)
  return formatDateISO();
};

export default function DailyEntryScreen() {
  const { date: paramDate } = useLocalSearchParams();
  const entryDate = normalizeDateParam(paramDate);

  // Track mount status to avoid setState on unmounted component
  const mountedRef = useRef<boolean>(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false; // prevent state updates after unmount
    };
  }, []);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyText, setDailyText] = useState('');
  const [accomplishments, setAccomplishments] = useState(['']);
  const [thingsLearned, setThingsLearned] = useState(['']);
  const [thingsGrateful, setThingsGrateful] = useState(['']);
  const [ratings, setRatings] = useState({
    productivity: 3,
    mood: 3,
    energy: 3,
  });

  // Data loading
  const loadExistingEntry = useCallback(async () => {
    try {
      await databaseService.initialize();
      const existingEntry = await databaseService.getDailyEntry(entryDate);

      if (existingEntry && mountedRef.current) {
        setDailyText(existingEntry.daily_text);
        // Ensure lists are not empty for the UI
        setAccomplishments(
          existingEntry.accomplishments.length > 0 ? existingEntry.accomplishments : [''],
        );
        setThingsLearned(
          existingEntry.things_learned.length > 0 ? existingEntry.things_learned : [''],
        );
        setThingsGrateful(
          existingEntry.things_grateful.length > 0 ? existingEntry.things_grateful : [''],
        );
        setRatings(existingEntry.ratings);
      }
    } catch (error) {
      console.error('Error loading existing entry:', error);
      Alert.alert('Error', 'Failed to load existing entry');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [entryDate]);

  useEffect(() => {
    loadExistingEntry();
  }, [loadExistingEntry]);

  // Data saving with double-submission protection
  const saveEntry = async () => {
    // Guard against double-submission at handler level
    if (saving) {
      return;
    }

    if (mountedRef.current) setSaving(true);
    try {
      const entry: DailyEntry = {
        date: entryDate,
        daily_text: dailyText,
        accomplishments: accomplishments.filter((item) => item.trim() !== ''),
        things_learned: thingsLearned.filter((item) => item.trim() !== ''),
        things_grateful: thingsGrateful.filter((item) => item.trim() !== ''),
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
      if (mountedRef.current) setSaving(false);
    }
  };

  // Render Logic
  if (loading) {
    return <LoadingScreen message="Loading entry..." />;
  }

  // Parse entryDate as local date to avoid UTC shift
  const [y, m, d] = entryDate.split('-').map(Number);
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <RefreshableScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        onRefresh={loadExistingEntry}>
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
          disabled={saving}
          fullWidth
          style={styles.saveButton}
        />
      </View>
    </>
  );
}

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
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.success,
  },
});
