import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

interface AuthHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly brand?: string;
}

export function AuthHeader({
  title,
  subtitle,
  brand = "CommerceFlow",
}: AuthHeaderProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.root, { gap: spacing.sm, marginBottom: spacing.lg }]}>
      <Text style={[typography.caption, { color: colors.accent }]}>{brand}</Text>
      <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
});
