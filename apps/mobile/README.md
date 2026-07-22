# CommerceFlow Customer Mobile

Expo React Native customer app — authentication (M1.1) on the M1.0 foundation. Shopping arrives in later sprints.

## Stack

- Expo SDK 57 + Expo Router
- Expo Dev Client + EAS Build
- React Query, React Hook Form, Zod
- NativeWind (Tailwind for RN)
- Expo SecureStore, Expo Image
- Reanimated + Gesture Handler
- Shared packages: `@commerceflow/api-client`, `types`, `validation`, `utils`

## Structure

```
apps/mobile/
├── app/                 # Expo Router routes (splash, auth, tabs)
├── features/auth/       # Auth UI, SecureStore, AuthProvider
│   ├── components/      # AuthHeader, AuthCard, FormTextField, …
│   └── screens/         # Welcome, Login, Register, Forgot Password
├── components/          # Shared UI
├── providers/           # Query, Theme, AppProviders
├── services/            # Shared API client wiring
├── lib/                 # Typed config (`config.ts`) + helpers
├── theme/               # Design tokens (light/dark)
├── hooks/
├── .env.example         # Template for local overrides
├── .env.development     # Development defaults
├── .env.production      # Production placeholders
├── eas.json             # EAS profiles + build-time env
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

## Environment configuration

API and runtime settings are driven by `EXPO_PUBLIC_*` variables. The typed module [`lib/config.ts`](lib/config.ts) is the only place the app should read them (e.g. `config.apiBaseUrl`).

Do **not** put API URLs in `app.json` `extra` — that is no longer the source of truth.

### Development

Committed defaults live in [`.env.development`](.env.development):

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

For a physical device (or Android emulator that cannot reach host `localhost`), copy the example and set your LAN IP in a local override:

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
# then edit EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000
```

`.env.local` is gitignored. Restart Metro after changing env files (`EXPO_PUBLIC_*` are inlined at bundle time).

### Production

Committed placeholders live in [`.env.production`](.env.production):

```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

Replace `https://api.example.com` with your real API host before shipping, preferably via EAS (below) rather than committing secrets or customer-specific hosts.

### Changing the API endpoint

1. Update `EXPO_PUBLIC_API_BASE_URL` in the relevant `.env.*` file and/or EAS profile `env`.
2. Restart Expo / rebuild the native binary if you need the new value in a Development Build or store build.
3. Confirm the app reads it through `config.apiBaseUrl` (no hardcoded URLs in feature code).

### EAS Build

[`eas.json`](eas.json) sets `EXPO_PUBLIC_*` per profile (`development`, `preview`, `production`). EAS injects those values at build time so the JS bundle embeds the correct API host.

Override without editing the repo by using [EAS environment variables / secrets](https://docs.expo.dev/eas/environment-variables/) for the same keys (`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_ENV`).

Example (development client build):

```bash
cd apps/mobile
eas build --profile development --platform android
```

## Scripts

| Script | Purpose |
|--------|---------|
| `start` / `dev` | Expo Metro (dev client on `dev`) |
| `android` / `ios` | Native run |
| `lint` / `typecheck` / `test` | Quality |
| `build` | Web export smoke build |

## Auth (M1.1)

- Welcome, Login, Register, Forgot Password screens
- Shared Zod schemas + React Hook Form + `@commerceflow/api-client`
- Tokens only in Expo SecureStore
- Session bootstrap + refresh via AuthProvider
- Authenticated users land in Main Tabs; unauthenticated users stay in Auth stack
- Logout from Account tab
