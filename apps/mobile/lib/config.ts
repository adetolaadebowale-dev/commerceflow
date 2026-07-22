/**
 * Typed application configuration for CommerceFlow Mobile.
 *
 * Source of truth: `EXPO_PUBLIC_*` environment variables
 * (`.env.development`, `.env.production`, `.env.local`, or EAS Build `env`).
 *
 * Add new keys here so call sites never hardcode environment values.
 */

export type AppEnvironment = "development" | "production";

export interface AppConfig {
  readonly appEnvironment: AppEnvironment;
  readonly apiBaseUrl: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

/** Fallbacks when an env file / EAS profile has not injected a value (e.g. unit tests). */
const FALLBACK_API_BASE_URL: Record<AppEnvironment, string> = {
  development: "http://localhost:3000",
  production: "https://api.example.com",
};

function resolveEnvironment(): AppEnvironment {
  const explicit = process.env.EXPO_PUBLIC_APP_ENV;
  if (explicit === "production" || explicit === "development") {
    return explicit;
  }

  const isDev =
    typeof __DEV__ !== "undefined"
      ? __DEV__
      : process.env.NODE_ENV !== "production";

  return isDev ? "development" : "production";
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim().replace(/\/$/, "");
  return trimmed ? trimmed : undefined;
}

function resolveApiBaseUrl(environment: AppEnvironment): string {
  return (
    normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) ??
    FALLBACK_API_BASE_URL[environment]
  );
}

const appEnvironment = resolveEnvironment();

export const config: AppConfig = {
  appEnvironment,
  apiBaseUrl: resolveApiBaseUrl(appEnvironment),
  isDevelopment: appEnvironment === "development",
  isProduction: appEnvironment === "production",
} as const;
