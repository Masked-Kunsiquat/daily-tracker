// ============================================
// components/home/RecentEntriesSection.tsx
// ============================================
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { DailyEntry } from "../../lib/database";
import { Colors } from "../../styles/colors";
import { Typography } from "../../styles/typography";
import { Spacing } from "../../styles/spacing";
import { EmptyState } from "../common/EmptyState";
import { EntryCard } from "./EntryCard";

interface RecentEntriesSectionProps {
  entries: DailyEntry[];
  todayISO: string;
}

export const RecentEntriesSection: React.FC<RecentEntriesSectionProps> = ({
  entries,
  todayISO,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Entries</Text>
      {entries.length > 0 ? (
        <View>
          {entries.map((entry) => (
            <EntryCard key={entry.date} entry={entry} todayISO={todayISO} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="📝"
          title="No entries yet"
          message="Start your journaling journey today!"
          actionLabel="New Entry"
          onAction={() => router.push("/daily-entry")}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: 0,
  } as ViewStyle,
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.lg,
    color: Colors.text,
  } as TextStyle,
});
