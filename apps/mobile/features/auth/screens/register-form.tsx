import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { registerSchema, type RegisterInput } from "@commerceflow/validation";

import {
  AuthCard,
  AuthHeader,
  AuthScreen,
  FormErrorBanner,
  FormTextField,
  PasswordField,
  PrimaryButton,
} from "@/features/auth/components";
import { useAuth } from "@/features/auth";
import { applyAuthFormError } from "@/features/auth/map-auth-error";
import { useTheme } from "@/providers/theme-provider";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, spacing, typography } = useTheme();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  async function onSubmit(values: RegisterInput): Promise<void> {
    try {
      await register(values);
      router.replace("/(tabs)");
    } catch (error) {
      applyAuthFormError(
        error,
        setError,
        "Unable to create your account. Please try again.",
      );
    }
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="Create account"
        subtitle="Join CommerceFlow with a few details to get started."
      />
      <AuthCard>
        {errors.root?.message ? (
          <FormErrorBanner message={errors.root.message} />
        ) : null}

        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <FormTextField
              ref={ref}
              label="First name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="given-name"
              textContentType="givenName"
              editable={!isSubmitting}
              error={errors.firstName?.message}
              placeholder="Alex"
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <FormTextField
              ref={ref}
              label="Last name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="family-name"
              textContentType="familyName"
              editable={!isSubmitting}
              error={errors.lastName?.message}
              placeholder="Rivera"
            />
          )}
        />

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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <PasswordField
              ref={ref}
              label="Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isSubmitting}
              error={errors.password?.message}
              placeholder="At least 8 characters"
            />
          )}
        />

        <PrimaryButton
          label="Create account"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </AuthCard>

      <View style={{ marginTop: spacing.lg, alignItems: "center", gap: spacing.sm }}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Already have an account?
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={8} style={{ minHeight: 44 }}>
            <Text style={[typography.label, { color: colors.primary }]}>
              Sign in
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}
