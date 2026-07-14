import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../auth/auth-context";
import { AuthButton } from "../components/auth/AuthFormControls";
import { colors, radii, spacing, typography } from "../constants/theme";

export function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/(guest)/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.greeting}>Good to see you</Text>
          <Text style={styles.name}>
            {user?.user.firstName} {user?.user.lastName}
          </Text>
          <Text style={styles.email}>{user?.user.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your CommerceFlow account</Text>
          <Text style={styles.infoCopy}>
            You are signed in and ready to explore curated collections,
            personalised recommendations, and seamless checkout.
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Role</Text>
            <Text style={styles.metaValue}>{user?.user.role}</Text>
          </View>
        </View>

        <AuthButton
          label="Sign out"
          onPress={() => void handleLogout()}
          loading={isLoggingOut}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.caption,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoTitle: {
    ...typography.label,
    fontSize: 18,
    color: colors.textPrimary,
  },
  infoCopy: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.label,
    color: colors.primary,
    textTransform: "capitalize",
  },
});
