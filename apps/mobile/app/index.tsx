import { Redirect } from "expo-router";

import { useAuth } from "../src/auth/auth-context";
import { SessionSplashScreen } from "../src/components/splash/SessionSplashScreen";

console.log("[startup][app/index.tsx] module loaded");

export default function Index() {
  console.log("[startup][app/index.tsx] Index render start");
  const { isAuthenticated, isLoading } = useAuth();

  console.log("[startup][app/index.tsx] auth state", {
    isAuthenticated,
    isLoading,
  });

  if (isLoading) {
    console.log("[startup][app/index.tsx] rendering SessionSplashScreen");
    return <SessionSplashScreen />;
  }

  if (isAuthenticated) {
    console.log("[startup][app/index.tsx] redirecting to protected home");
    return <Redirect href="/(protected)/home" />;
  }

  console.log("[startup][app/index.tsx] redirecting to guest login");
  return <Redirect href="/(guest)/login" />;
}
