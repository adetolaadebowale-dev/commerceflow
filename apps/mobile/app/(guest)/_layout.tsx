import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../src/auth/auth-context";
import { SessionSplashScreen } from "../../src/components/splash/SessionSplashScreen";

export default function GuestLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SessionSplashScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(protected)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#F6F4F1" },
      }}
    />
  );
}
