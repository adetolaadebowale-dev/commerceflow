import { Link } from "expo-router";
import { Pressable, Text } from "react-native";

import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { useTheme } from "@/providers/theme-provider";

/**
 * Auth group placeholder — login/register UI deferred past M1.0.
 */
export default function AuthIndexRoute() {
  const { colors, spacing, radii, typography } = useTheme();

  return (
    <PlaceholderScreen
      title="Sign in"
      description="Authentication screens are not built in M1.0. SecureStore session bootstrap and token refresh are wired for later sprints."
      badge="Auth"
    >
      <Link href="/onboarding" asChild>
        <Pressable
          style={{
            marginTop: spacing.lg,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignItems: "center",
          }}
        >
          <Text style={[typography.label, { color: colors.text }]}>
            Back to Onboarding
          </Text>
        </Pressable>
      </Link>
    </PlaceholderScreen>
  );
}
