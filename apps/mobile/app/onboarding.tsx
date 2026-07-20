import { Link } from "expo-router";
import { Pressable, Text } from "react-native";

import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { useTheme } from "@/providers/theme-provider";

/**
 * Onboarding placeholder — navigation only (no shopping / auth forms).
 */
export default function OnboardingRoute() {
  const { colors, spacing, radii, typography } = useTheme();

  return (
    <PlaceholderScreen
      title="Welcome"
      description="Onboarding placeholder for Sprint M1.0. Continue to the auth shell or explore the main tabs once signed in."
      badge="Onboarding"
    >
      <Link href="/(auth)" asChild>
        <Pressable
          style={{
            marginTop: spacing.lg,
            backgroundColor: colors.primary,
            borderRadius: radii.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: "center",
          }}
        >
          <Text style={[typography.label, { color: colors.textInverse }]}>
            Continue to Auth
          </Text>
        </Pressable>
      </Link>
      <Link href="/(tabs)" asChild>
        <Pressable
          style={{
            marginTop: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: "center",
          }}
        >
          <Text style={[typography.label, { color: colors.text }]}>
            Preview Main Tabs
          </Text>
        </Pressable>
      </Link>
    </PlaceholderScreen>
  );
}
