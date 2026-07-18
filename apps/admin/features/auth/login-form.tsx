"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiError } from "@/types/api";

const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Loading session..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Redirecting..." />
      </div>
    );
  }

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {
      await login(values);
      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to sign in. Please try again.";
      setError("root", { message });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-accent)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CommerceFlow Admin</CardTitle>
          <CardDescription>Sign in to manage the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {errors.root?.message ? (
            <div className="mb-4">
              <ErrorState message={errors.root.message} />
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : "false"}
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-[var(--color-destructive)]">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-[var(--color-destructive)]">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
