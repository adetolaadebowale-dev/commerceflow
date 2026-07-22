import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import {
  AuthCard,
  AuthHeader,
  AuthScreen,
  PrimaryButton,
} from "@/features/auth/components";
import { useTheme } from "@/providers/theme-provider";

export function WelcomeScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();

  return (
    <AuthScreen>
      <AuthHeader
        title="Welcome"
        subtitle="Sign in or create an account to continue. Shopping arrives in a later sprint."
      />
      <AuthCard>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Your session is stored securely on this device. Tokens never leave
          Expo SecureStore.
        </Text>

        <View style={{ gap: spacing.sm }}>
          <PrimaryButton
            label="Sign in"
            onPress={() => {
              router.push("/(auth)/login");
            }}
          />
          <PrimaryButton
            label="Create account"
            variant="secondary"
            onPress={() => {
              router.push("/(auth)/register");
            }}
          />
        </View>
      </AuthCard>

      <Text
        style={[
          typography.caption,
          styles.footer,
          { color: colors.textSecondary, marginTop: spacing.lg },
        ]}
      >
        CommerceFlow · Customer app
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    textAlign: "center",
  },
});
