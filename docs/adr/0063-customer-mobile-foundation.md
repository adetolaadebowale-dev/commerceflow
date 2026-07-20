# Customer Mobile Application (Sprint M1.0)

## Status

Accepted — foundation only (no shopping / login UI).

## Date

2026-07-20

## Decision

Customer mobile lives at `apps/mobile` on **Expo SDK 57** with **Expo Router**, feature-first folders, NativeWind, React Query, and shared `@commerceflow/*` packages.

Auth foundation uses Expo SecureStore + shared `createAuthClient` refresh. Placeholder routes: Splash, Onboarding, Auth, Main Tabs.

## Consequences

- Later sprints add login UI and shopping features on this shell.
- Prefer `EXPO_PUBLIC_API_BASE_URL` for environment-specific API hosts.
- Do not duplicate API request logic — extend `services/api-client.ts`.
