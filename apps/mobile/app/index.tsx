import { Redirect } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

import { useAuth } from "@/features/auth";

/**
 * Entry redirect: bootstrap → splash → onboarding/auth/tabs.
 */
export default function Index() {
  const { isBootstrapping, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isBootstrapping) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [isBootstrapping]);

  if (isBootstrapping) {
    return <Redirect href="/splash" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
