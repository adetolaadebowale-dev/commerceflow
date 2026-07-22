import { Redirect, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/features/auth/components";
import { useAuth } from "@/features/auth";
import { useTheme } from "@/providers/theme-provider";

export default function AccountTab() {
  const { user, isAuthenticated, logout, isBootstrapping } = useAuth();
  const { colors, spacing, radii, typography } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)" />;
  }

  async function onLogout(): Promise<void> {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/(auth)");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.content, { padding: spacing.lg, gap: spacing.md }]}>
        <Text style={[typography.caption, { color: colors.accent }]}>
          Account
        </Text>
        <Text style={[typography.title, { color: colors.text }]}>
          {user.user.firstName} {user.user.lastName}
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {user.user.email}
        </Text>

        <View
          style={{
            marginTop: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            You are signed in. Shopping features arrive in a later sprint.
          </Text>
          <PrimaryButton
            label="Sign out"
            variant="secondary"
            loading={isLoggingOut}
            disabled={isLoggingOut}
            onPress={() => {
              void onLogout();
            }}
          />
        </View>
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
  },
});
