import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { databaseService, DailyEntry } from '../lib/database';

export default function DailyEntryScreen() {
  const { date: paramDate } = useLocalSearchParams();
  const entryDate = (paramDate as string) || new Date().toISOString().split('T')[0];
  
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

  useEffect(() => {
    loadExistingEntry();
  }, [entryDate]);

  const loadExistingEntry = async () => {
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
  };

  const addListItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList([...list, '']);
  };

  const updateListItem = (
    list: string[], 
    setList: React.Dispatch<React.SetStateAction<string[]>>, 
    index: number, 
    value: string
  ) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const removeListItem = (
    list: string[], 
    setList: React.Dispatch<React.SetStateAction<string[]>>, 
    index: number
  ) => {
    if (list.length > 1) {
      const newList = list.filter((_, i) => i !== index);
      setList(newList);
    }
  };

  const renderStarRating = (category: keyof typeof ratings) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRatings({ ...ratings, [category]: star })}
          >
            <Text style={[
              styles.star,
              star <= ratings[category] ? styles.starFilled : styles.starEmpty
            ]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderListSection = (
    title: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder: string
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {list.map((item, index) => (
        <View key={index} style={styles.listItemContainer}>
          <TextInput
            style={styles.listInput}
            value={item}
            onChangeText={(text) => updateListItem(list, setList, index, text)}
            placeholder={placeholder}
            multiline
          />
          {list.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeListItem(list, setList, index)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addListItem(list, setList)}
      >
        <Text style={styles.addButtonText}>+ Add another</Text>
      </TouchableOpacity>
    </View>
  );

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
      
      Alert.alert(
        'Entry Saved!',
        'Your daily entry has been saved successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading entry...</Text>
      </View>
    );
  }

  const formattedDate = new Date(entryDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateHeader}>{formattedDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reflection</Text>
        <TextInput
          style={styles.textArea}
          value={dailyText}
          onChangeText={setDailyText}
          placeholder="How was your day? What happened? How are you feeling?"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {renderListSection(
        'Accomplishments',
        accomplishments,
        setAccomplishments,
        'What did you accomplish today?'
      )}

      {renderListSection(
        'Things I Learned',
        thingsLearned,
        setThingsLearned,
        'What did you learn today?'
      )}

      {renderListSection(
        'Things I\'m Grateful For',
        thingsGrateful,
        setThingsGrateful,
        'What are you grateful for today?'
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Ratings</Text>
        
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Productivity</Text>
          {renderStarRating('productivity')}
        </View>
        
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Mood</Text>
          {renderStarRating('mood')}
        </View>
        
        <View style={styles.ratingItem}>
          <Text style={styles.ratingLabel}>Energy</Text>
          {renderStarRating('energy')}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
        onPress={saveEntry}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save Entry</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  listInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 44,
  },
  removeButton: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  removeButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: 10,
    padding: 10,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  ratingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.3,
  },
  saveButton: {
    backgroundColor: '#34C759',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});