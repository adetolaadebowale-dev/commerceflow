import { ApiClientError } from "@commerceflow/api-client";
import { loginSchema } from "@commerceflow/validation";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { useAuth } from "../auth/auth-context";
import { AuthScreenLayout } from "../components/auth/AuthScreenLayout";
import {
  AuthButton,
  AuthTextField,
  ErrorBanner,
} from "../components/auth/AuthFormControls";
import { colors, typography } from "../constants/theme";

export function LoginScreen() {
  const router = useRouter();
  const { login, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    setFormError(null);
    clearError();

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });

      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(parsed.data);
      router.replace("/(protected)/home");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to continue your curated shopping journey."
      icon="log-in-outline"
      footer={
        <Text style={styles.footerText}>
          New to CommerceFlow?{" "}
          <Link href="/(guest)/register" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Create an account</Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      {formError ? <ErrorBanner message={formError} /> : null}

      <AuthTextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        error={fieldErrors.email}
        keyboardType="email-address"
        icon="mail-outline"
        editable={!isSubmitting}
      />

      <AuthTextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        error={fieldErrors.password}
        secureTextEntry
        icon="lock-closed-outline"
        editable={!isSubmitting}
      />

      <AuthButton
        label="Sign in"
        onPress={() => void handleSubmit()}
        loading={isSubmitting}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.label,
    color: colors.primary,
  },
});
