import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { StartupErrorBoundary } from "@/components/debug/startup-error-boundary";
import { AppProviders } from "@/providers/app-providers";
import { useTheme } from "@/providers/theme-provider";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden in some environments.
});

function RootNavigator() {
  const { resolvedScheme } = useTheme();

  return (
    <>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <StartupErrorBoundary>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </StartupErrorBoundary>
  );
}
