import { Link } from "expo-router";
import { Pressable, Text } from "react-native";

import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { useTheme } from "@/providers/theme-provider";

/**
 * Optional onboarding placeholder — auth welcome is the primary entry.
 */
export default function OnboardingRoute() {
  const { colors, spacing, radii, typography } = useTheme();

  return (
    <PlaceholderScreen
      title="Getting started"
      description="Continue to the customer authentication experience."
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
            minHeight: 48,
            justifyContent: "center",
          }}
        >
          <Text style={[typography.label, { color: colors.textInverse }]}>
            Continue to Welcome
          </Text>
        </Pressable>
      </Link>
    </PlaceholderScreen>
  );
}
