import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../src/auth/auth-context";
import { SessionSplashScreen } from "../../src/components/splash/SessionSplashScreen";

export default function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SessionSplashScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(guest)/login" />;
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
