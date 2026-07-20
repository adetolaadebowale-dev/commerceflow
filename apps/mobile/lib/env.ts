import Constants from "expo-constants";

export type AppEnvironment = "development" | "production";

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

const DEFAULT_API_BASE_URL: Record<AppEnvironment, string> = {
  development: "http://localhost:3000",
  production: "https://api.commerceflow.app",
};

function resolveApiBaseUrl(environment: AppEnvironment): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const fromExtra = (
    Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
  )?.apiBaseUrl?.replace(/\/$/, "");

  if (fromExtra) {
    return fromExtra;
  }

  return DEFAULT_API_BASE_URL[environment];
}

export const appEnvironment = resolveEnvironment();
export const API_BASE_URL = resolveApiBaseUrl(appEnvironment);

export const env = {
  appEnvironment,
  apiBaseUrl: API_BASE_URL,
  isDevelopment: appEnvironment === "development",
  isProduction: appEnvironment === "production",
} as const;
