import { Stack } from "expo-router";

import { SessionProvider } from "../src/auth/session-provider";
import { StartupErrorBoundary } from "../src/components/debug/StartupErrorBoundary";

console.log("[startup][app/_layout.tsx] module loaded");

export default function RootLayout() {
  console.log("[startup][app/_layout.tsx] RootLayout render start");

  return (
    <StartupErrorBoundary>
      <SessionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SessionProvider>
    </StartupErrorBoundary>
  );
}
