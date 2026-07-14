import { ApiClientError } from "@commerceflow/api-client";
import { registerSchema } from "@commerceflow/validation";
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

export function RegisterScreen() {
  const router = useRouter();
  const { register, clearError } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(): Promise<void> {
    setFormError(null);
    clearError();

    const parsed = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
    });

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        firstName: flattened.firstName?.[0],
        lastName: flattened.lastName?.[0],
        email: flattened.email?.[0],
        password: flattened.password?.[0],
      });

      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register(parsed.data);
      router.replace("/(protected)/home");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError("Unable to create your account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="Join CommerceFlow for a refined, seamless shopping experience."
      icon="sparkles-outline"
      footer={
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/(guest)/login" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </Link>
        </Text>
      }
    >
      {formError ? <ErrorBanner message={formError} /> : null}

      <AuthTextField
        label="First name"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Jane"
        error={fieldErrors.firstName}
        autoCapitalize="words"
        icon="person-outline"
        editable={!isSubmitting}
      />

      <AuthTextField
        label="Last name"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Doe"
        error={fieldErrors.lastName}
        autoCapitalize="words"
        icon="person-outline"
        editable={!isSubmitting}
      />

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
        placeholder="At least 8 characters"
        error={fieldErrors.password}
        secureTextEntry
        icon="lock-closed-outline"
        editable={!isSubmitting}
      />

      <AuthButton
        label="Create account"
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
