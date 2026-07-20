import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/features/auth";
import { useTheme } from "@/providers/theme-provider";

/**
 * Splash placeholder — shown while session bootstrap completes.
 */
export default function SplashRoute() {
  const { colors, typography, spacing } = useTheme();
  const { isBootstrapping, isAuthenticated } = useAuth();
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDurationElapsed(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!isBootstrapping && minDurationElapsed) {
    return (
      <Redirect href={isAuthenticated ? "/(tabs)" : "/onboarding"} />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Text style={[typography.display, { color: colors.text }]}>
        CommerceFlow
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.sm },
        ]}
      >
        Customer mobile foundation
      </Text>
      <ActivityIndicator
        color={colors.primary}
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
