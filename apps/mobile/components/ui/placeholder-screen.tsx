import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/providers/theme-provider";

interface PlaceholderScreenProps {
  readonly title: string;
  readonly description: string;
  readonly badge?: string;
  readonly children?: ReactNode;
}

export function PlaceholderScreen({
  title,
  description,
  badge = "M1.0 Foundation",
  children,
}: PlaceholderScreenProps) {
  const { colors, spacing, radii, typography } = useTheme();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.content, { padding: spacing.lg, gap: spacing.md }]}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: radii.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {badge}
          </Text>
        </View>
        <Text style={[typography.display, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {description}
        </Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
  },
});
