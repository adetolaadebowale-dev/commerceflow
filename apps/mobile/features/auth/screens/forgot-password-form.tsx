import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@commerceflow/validation";

import {
  AuthCard,
  AuthHeader,
  AuthScreen,
  FormErrorBanner,
  FormTextField,
  PrimaryButton,
} from "@/features/auth/components";
import { useAuth } from "@/features/auth";
import { applyAuthFormError } from "@/features/auth/map-auth-error";
import { useTheme } from "@/providers/theme-provider";

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const { colors, spacing, typography } = useTheme();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordInput): Promise<void> {
    setSuccessMessage(null);
    try {
      const result = await forgotPassword(values);
      setSuccessMessage(result.message);
    } catch (error) {
      applyAuthFormError(
        error,
        setError,
        "Unable to send reset instructions. Please try again.",
      );
    }
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="Forgot password"
        subtitle="Enter your email and we will send reset instructions if an account exists."
      />
      <AuthCard>
        {errors.root?.message ? (
          <FormErrorBanner message={errors.root.message} />
        ) : null}

        {successMessage ? (
          <View
            accessibilityLiveRegion="polite"
            style={{
              backgroundColor: colors.surfaceMuted,
              borderRadius: 12,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.success,
            }}
          >
            <Text style={[typography.caption, { color: colors.success }]}>
              {successMessage}
            </Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <FormTextField
              ref={ref}
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isSubmitting}
              error={errors.email?.message}
              placeholder="you@example.com"
            />
          )}
        />

        <PrimaryButton
          label="Send reset link"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </AuthCard>

      <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={8} style={{ minHeight: 44 }}>
            <Text style={[typography.label, { color: colors.primary }]}>
              Back to sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}
