# CommerceFlow

Enterprise-grade headless ecommerce platform (backend **v1.0**).

CommerceFlow is a modular-monolith commerce API with admin and mobile clients, shared TypeScript packages, store-scoped authorization, audit logging, and domain events across the full order-to-fulfillment lifecycle.

---

## Project overview

CommerceFlow demonstrates production-minded engineering practices:

- Domain-driven feature organization
- API-first contracts shared via `@commerceflow/*` packages
- Type-safe validation and clients
- Automated tests and Architecture Decision Records (ADRs)
- Platform operations and production-hardening diagnostics

Primary deliverable for v1.0 is the **backend API** (`apps/api`). Admin and mobile apps consume that API.

---

## Architecture summary

```
┌─────────────────────────────────────────────────────────────┐
│                     CommerceFlow Monorepo                    │
├─────────────┬─────────────┬─────────────────────────────────┤
│  apps/api   │ apps/admin  │         apps/mobile              │
│  (Next.js)  │   (Vite)    │         (Expo)                   │
│  Business   │  Admin UI   │       Customer UI                │
│   Logic     │             │                                  │
└──────┬──────┴──────┬──────┴──────────────┬──────────────────┘
       │             │                     │
       └─────────────┼─────────────────────┘
                     ▼
       ┌─────────────────────────────────────┐
       │         @commerceflow/* packages     │
       │  types · validation · api-client     │
       │  config · ui · utils                 │
       └─────────────────────────────────────┘
```

- **Modular monolith** in `apps/api` (domain folders, not microservices)
- **PostgreSQL** via Prisma for persistence
- **Store-scoped RBAC** for multi-tenant operations
- See [ADR 0001](docs/adr/0001-monorepo-architecture.md) and the [Engineering Playbook](docs/engineering/engineering-playbook.md)

---

## Technology stack

| Area | Stack |
|------|--------|
| API | Next.js 16, TypeScript, Prisma, PostgreSQL |
| Admin | React, Vite, TypeScript |
| Mobile | React Native, Expo, TypeScript |
| Tooling | pnpm workspaces, Turborepo, Vitest, ESLint, Prettier |

Node.js **24.15.0** (`.nvmrc`) and pnpm **11.10.0** (`packageManager` in root `package.json`).

---

## Prerequisites

- Node.js 24.15.0+
- pnpm 11.10.0+
- PostgreSQL (required for persisted API repositories and migrations)

---

## Installation

```bash
git clone <repository-url>
cd commerceflow
pnpm install
```

---

## Environment setup

1. Copy the root template:

   ```bash
   cp .env.example apps/api/.env
   ```

2. Set at least:

   - `DATABASE_URL`
   - `AUTH_JWT_SECRET`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`

3. See [`.env.example`](.env.example) for the full variable list and [docs/deployment.md](docs/deployment.md) for production notes.

Do not commit real secrets.

---

## Database migration

Generate the Prisma client and apply migrations:

```bash
pnpm --filter api db:generate
pnpm --filter api db:migrate
```

`db:migrate` runs `prisma migrate deploy` (safe for non-interactive environments).

Optional seed (non-production):

```bash
pnpm --filter api db:seed
```

Migration verification notes: [docs/migration-verification.md](docs/migration-verification.md).

---

## Running locally

Start all workspace `dev` tasks:

```bash
pnpm dev
```

Or start apps individually:

```bash
pnpm --filter api dev      # http://localhost:3000
pnpm --filter admin dev    # http://localhost:5173
pnpm --filter mobile dev   # Expo (port 8081)
```

---

## Testing

```bash
pnpm test
```

API tests use Vitest. Without `DATABASE_URL`, the API falls back to in-memory repositories for unit tests.

---

## Build

```bash
pnpm build
```

API-only:

```bash
pnpm --filter api build
```

---

## Project structure

```
commerceflow/
├── apps/
│   ├── api/                 # Next.js API (business logic + REST routes)
│   ├── admin/               # Vite admin dashboard
│   └── mobile/              # Expo customer app
├── packages/
│   ├── api-client/          # Typed HTTP client
│   ├── config/              # Shared TS / ESLint / Prettier config
│   ├── types/               # Shared domain types
│   ├── validation/          # Zod schemas
│   ├── ui/                  # Shared UI scaffold (reserved)
│   └── utils/               # Shared utils scaffold (reserved)
├── docs/
│   ├── adr/                 # Architecture Decision Records
│   ├── architecture/        # Phase summaries
│   ├── engineering/         # Engineering playbook
│   ├── deployment.md
│   └── migration-verification.md
├── .env.example
├── CHANGELOG.md
├── PROJECT_CONTEXT.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Monorepo packages

| Package | Name | Purpose |
|---------|------|---------|
| `packages/types` | `@commerceflow/types` | Shared domain types and constants |
| `packages/validation` | `@commerceflow/validation` | Zod request/response schemas |
| `packages/api-client` | `@commerceflow/api-client` | Typed REST client helpers |
| `packages/config` | `@commerceflow/config` | Shared toolchain config |
| `packages/ui` | `@commerceflow/ui` | UI package scaffold |
| `packages/utils` | `@commerceflow/utils` | Utils package scaffold |

---

## Available scripts

Root (`pnpm <script>`):

| Script | Description |
|--------|-------------|
| `dev` | Run workspace `dev` tasks via Turborepo |
| `build` | Build all packages and apps |
| `test` | Run workspace tests |
| `lint` | Lint all packages and apps |
| `typecheck` | Typecheck all packages and apps |
| `clean` | Clean build outputs |
| `format` / `format:check` | Prettier write / check |

API (`pnpm --filter api <script>`):

| Script | Description |
|--------|-------------|
| `dev` | Next.js dev server on port 3000 |
| `build` | `prisma generate` + `next build` |
| `start` | Production `next start` |
| `test` | Vitest |
| `db:generate` | Prisma client generate |
| `db:migrate` | `prisma migrate deploy` |
| `db:seed` | Seed script |

---

## Documentation

| Doc | Path |
|-----|------|
| Changelog (v1.0.0) | [CHANGELOG.md](CHANGELOG.md) |
| Deployment guide | [docs/deployment.md](docs/deployment.md) |
| Migration verification | [docs/migration-verification.md](docs/migration-verification.md) |
| Engineering playbook | [docs/engineering/engineering-playbook.md](docs/engineering/engineering-playbook.md) |
| ADR index | [docs/adr/README.md](docs/adr/README.md) |
| Project context | [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) |

---

## Development status

**Backend v1.0 complete** (Sprint 12.6 — Final Wrap-up).

Major capability areas are summarized in [CHANGELOG.md](CHANGELOG.md).

---

## License

MIT
