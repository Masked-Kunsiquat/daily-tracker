import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{today}</Text>
        <Text style={styles.welcomeText}>Ready to plan your day?</Text>
      </View>

      <View style={styles.quickActions}>
        <Link href="/daily-entry" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>📝 New Daily Entry</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/summaries" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>📊 View Summaries</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No entries yet</Text>
          <Text style={styles.placeholderSubtext}>Tap "New Daily Entry" to get started!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  recentSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  placeholder: {
    backgroundColor: '#f8f9fa',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});