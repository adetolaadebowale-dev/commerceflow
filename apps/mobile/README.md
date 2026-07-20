# CommerceFlow Customer Mobile (M1.0)

Expo React Native customer app foundation — navigation, theme, providers, API, and auth infrastructure. Shopping and login UI arrive in later sprints.

## Stack

- Expo SDK 57 + Expo Router
- React Query, React Hook Form, Zod
- NativeWind (Tailwind for RN)
- Expo SecureStore, Expo Image
- Reanimated + Gesture Handler
- Shared packages: `@commerceflow/api-client`, `types`, `validation`, `utils`

## Structure

```
apps/mobile/
├── app/                 # Expo Router routes (splash, onboarding, auth, tabs)
├── features/auth/       # Auth context, SecureStore, token refresh
├── components/          # Shared UI
├── providers/           # Query, Theme, AppProviders
├── services/            # Shared API client wiring
├── lib/                 # Env / helpers
├── theme/               # Design tokens (light/dark)
├── hooks/
└── assets/
```

## Setup

```bash
pnpm install
pnpm --filter @commerceflow/types build
pnpm --filter @commerceflow/validation build
pnpm --filter @commerceflow/api-client build
pnpm --filter @commerceflow/utils build

cp apps/mobile/.env.example apps/mobile/.env.local
pnpm --filter mobile start
```

Android / iOS (dev client):

```bash
pnpm --filter mobile android
pnpm --filter mobile ios
```

## Scripts

| Script | Purpose |
|--------|---------|
| `start` / `dev` | Expo Metro |
| `android` / `ios` | Native run |
| `lint` / `typecheck` / `test` | Quality |
| `build` | Web export smoke build |

## Auth (foundation only)

- Tokens in SecureStore
- Session bootstrap on launch
- Automatic access-token refresh via `@commerceflow/api-client` `refreshAccessToken`
- No login/register screens in M1.0
