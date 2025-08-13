import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';

interface DailyEntry {
  date: string;
  daily_text: string;
  accomplishments: string[];
  things_learned: string[];
  things_grateful: string[];
  ratings: {
    productivity: number;
    mood: number;
    energy: number;
  };
}

export default function DailyEntryScreen() {
  const [dailyText, setDailyText] = useState('');
  const [accomplishments, setAccomplishments] = useState(['']);
  const [thingsLearned, setThingsLearned] = useState(['']);
  const [thingsGrateful, setThingsGrateful] = useState(['']);
  const [ratings, setRatings] = useState({
    productivity: 3,
    mood: 3,
    energy: 3,
  });

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

  const saveEntry = () => {
    const entry: DailyEntry = {
      date: new Date().toISOString().split('T')[0],
      daily_text: dailyText,
      accomplishments: accomplishments.filter(item => item.trim() !== ''),
      things_learned: thingsLearned.filter(item => item.trim() !== ''),
      things_grateful: thingsGrateful.filter(item => item.trim() !== ''),
      ratings,
    };

    // TODO: Save to database
    console.log('Saving entry:', entry);
    
    Alert.alert(
      'Entry Saved!',
      'Your daily entry has been saved successfully.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView style={styles.container}>
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

      <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
        <Text style={styles.saveButtonText}>Save Entry</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});