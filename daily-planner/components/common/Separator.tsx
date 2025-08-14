// ============================================
// components/common/Separator.tsx
// ============================================
import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/styles/colors";
import { Spacing } from "@/styles/spacing";

interface SeparatorProps {
  spacing?: keyof typeof Spacing;
  color?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  spacing = "md",
  color = Colors.borderLight,
}) => {
  return (
    <View
      style={[
        styles.separator,
        {
          marginVertical: Spacing[spacing],
          backgroundColor: color,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: "100%",
  },
});
