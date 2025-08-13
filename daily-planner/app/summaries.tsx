import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function SummariesScreen() {
  const summaryTypes = [
    { title: 'Weekly Summaries', description: 'Last 4 weeks', count: 0 },
    { title: 'Monthly Summaries', description: 'Last 6 months', count: 0 },
    { title: 'Yearly Summaries', description: 'Previous years', count: 0 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered insights from your daily entries
        </Text>
      </View>

      {summaryTypes.map((type, index) => (
        <TouchableOpacity key={index} style={styles.summaryCard}>
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardTitle}>{type.title}</Text>
              <Text style={styles.cardDescription}>{type.description}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{type.count}</Text>
            </View>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonTitle}>🤖 Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          AI-powered summaries will analyze your daily entries to provide insights about:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Patterns in your productivity and mood</Text>
          <Text style={styles.featureItem}>• Your biggest accomplishments over time</Text>
          <Text style={styles.featureItem}>• Key learnings and growth areas</Text>
          <Text style={styles.featureItem}>• Trends in what you're grateful for</Text>
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
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  countBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 10,
  },
  comingSoon: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce7ff',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    lineHeight: 24,
  },
  featureList: {
    marginLeft: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});