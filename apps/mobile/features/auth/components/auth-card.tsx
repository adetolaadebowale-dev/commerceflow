import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

interface AuthCardProps {
  readonly children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  const { colors, spacing, radii, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderColor: colors.border,
          padding: spacing.lg,
          gap: spacing.md,
          ...shadows.md,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
