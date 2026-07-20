import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { useAuth } from "@/features/auth";
import { useTheme } from "@/providers/theme-provider";
import { Text } from "react-native";

export default function HomeTab() {
  const { isAuthenticated, user } = useAuth();
  const { colors, typography, spacing } = useTheme();

  return (
    <PlaceholderScreen
      title="Home"
      description="Main tabs shell for the customer app. Shopping features arrive in later mobile sprints."
      badge="Main Tabs"
    >
      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, marginTop: spacing.md },
        ]}
      >
        Session:{" "}
        {isAuthenticated
          ? `signed in as ${user?.user.email ?? "user"}`
          : "guest preview"}
      </Text>
    </PlaceholderScreen>
  );
}
