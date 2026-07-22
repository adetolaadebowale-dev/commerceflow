import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { loginSchema, type LoginInput } from "@commerceflow/validation";

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

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, spacing, typography } = useTheme();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput): Promise<void> {
    try {
      await login(values);
      router.replace("/(tabs)");
    } catch (error) {
      applyAuthFormError(
        error,
        setError,
        "Unable to sign in. Please check your credentials and try again.",
      );
    }
  }

  return (
    <AuthScreen>
      <AuthHeader
        title="Sign in"
        subtitle="Welcome back. Sign in to continue shopping with CommerceFlow."
      />
      <AuthCard>
        {errors.root?.message ? (
          <FormErrorBanner message={errors.root.message} />
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
              autoComplete="password"
              editable={!isSubmitting}
              error={errors.password?.message}
              placeholder="••••••••"
            />
          )}
        />

        <Link href="/(auth)/forgot-password" asChild>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center" }}
          >
            <Text style={[typography.caption, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </Pressable>
        </Link>

        <PrimaryButton
          label="Sign in"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </AuthCard>

      <View style={{ marginTop: spacing.lg, alignItems: "center", gap: spacing.sm }}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          New here?
        </Text>
        <Link href="/(auth)/register" asChild>
          <Pressable accessibilityRole="link" hitSlop={8} style={{ minHeight: 44 }}>
            <Text style={[typography.label, { color: colors.primary }]}>
              Create an account
            </Text>
          </Pressable>
        </Link>
      </View>
    </AuthScreen>
  );
}
