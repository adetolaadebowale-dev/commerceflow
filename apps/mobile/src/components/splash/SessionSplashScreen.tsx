import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "../../constants/theme";

export function SessionSplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>CF</Text>
      </View>
      <Text style={styles.title}>CommerceFlow</Text>
      <Text style={styles.subtitle}>Preparing your shopping experience</Text>
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.title,
    color: colors.textInverse,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loader: {
    marginTop: spacing.lg,
  },
});
