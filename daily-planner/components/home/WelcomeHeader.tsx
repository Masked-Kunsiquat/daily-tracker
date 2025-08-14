// ============================================
// components/home/WelcomeHeader.tsx
// ============================================
import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Typography } from "@/styles/typography";
import { Spacing } from "@/styles/spacing";
import { formatDateHuman } from "@/utils/dateHelpers";
import { Colors } from "@/styles/colors";

interface WelcomeHeaderProps {
  hasEntryToday: boolean;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  hasEntryToday,
}) => {
  const dateString = formatDateHuman();

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{dateString}</Text>
      <Text style={styles.welcomeText}>
        {hasEntryToday
          ? "Ready to update today's entry?"
          : "Ready to plan your day?"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    alignItems: "center",
  } as ViewStyle,
  dateText: {
    fontSize: Typography.sizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  } as TextStyle,
  welcomeText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    textAlign: "center",
  } as TextStyle,
});
