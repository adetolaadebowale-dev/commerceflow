# CommerceFlow Engineering Playbook

Developer guide for working in the CommerceFlow monorepo.

---

## Project Overview

CommerceFlow is an enterprise-grade **headless ecommerce platform** built as a portfolio project demonstrating senior-level engineering practices: domain-driven design, API-first development, type safety, modular architecture, and AI-assisted workflows.

### Applications

| App | Path | Stack | Role |
|-----|------|-------|------|
| API | `apps/api` | Next.js 16, TypeScript | Business logic, REST/JSON APIs |
| Admin | `apps/admin` | React, Vite, TypeScript | Internal management dashboard |
| Mobile | `apps/mobile` | React Native, Expo, TypeScript | Customer shopping experience |

### Core Domains

Identity, Customer, Catalogue, Inventory, Shopping, Checkout, Orders, Payments, Promotions, Reviews, Notifications, Analytics, Platform Administration.

**Phase 3 — Shipping & Fulfillment Operations** (Sprints 8.2–8.9): Suppliers, Purchase Orders, Warehouses, Warehouse Transfers, Replenishment, Reservations, Pick Lists, Inventory Allocations, Shipment Packages, Shipments, Shipment Tracking, Warehouse Fulfillment, Returns, Inventory Adjustments, Cycle Counts, and the cross-domain Operations orchestration layer. See [Phase 3 Operational Readiness](../architecture/phase3-operational-readiness.md) and [ADR 0034](../adr/0034-phase3-operational-readiness.md).

### Principles

- Business logic belongs in the backend.
- Features are organized by domain.
- TypeScript across the entire stack.
- AI tools implement approved architecture; they do not replace architectural decisions.

---

## Architecture Overview

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
       │  utils · ui · config                 │
       └─────────────────────────────────────┘
```

- **Modular monolith** in the API layer (domain folders, not microservices).
- **API-first**: admin and mobile consume HTTP APIs; they do not own business rules.
- **Monorepo**: pnpm workspaces + Turborepo for builds, lint, typecheck, and dev orchestration.
- See [ADR 0001: Monorepo Architecture](../adr/0001-monorepo-architecture.md) for decision rationale.

### Toolchain

| Tool | Version / Role |
|------|----------------|
| Node.js | 24.15.0 (see `.nvmrc`) |
| pnpm | 11.10.0 (see `packageManager` in root `package.json`) |
| Turborepo | Task orchestration and caching |
| TypeScript | Strict mode via `@commerceflow/config` |

---

## Folder Structure

```
commerceflow/
├── apps/
│   ├── api/                 # Next.js API (App Router, src/app/)
│   ├── admin/               # Vite + React admin dashboard
│   └── mobile/              # Expo Router mobile app
├── packages/
│   ├── config/              # Shared TS, ESLint, Prettier configs
│   ├── types/               # Domain and API TypeScript types
│   ├── validation/          # Zod schemas
│   ├── api-client/          # Typed HTTP client
│   ├── utils/               # Pure utilities
│   └── ui/                  # Shared React components (foundation)
├── docs/
│   ├── adr/                 # Architecture Decision Records
│   └── engineering/         # This playbook and engineering docs
├── infrastructure/          # Docker, CI/CD (future sprints)
├── .cursor/
│   └── project-rules.md     # AI and developer coding rules
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

### API App Layout (target pattern)

```
apps/api/src/
├── app/
│   ├── api/                 # Route handlers (REST endpoints)
│   │   └── [domain]/
│   ├── layout.tsx
│   └── page.tsx
└── lib/                     # Server utilities, domain services
```

### Admin App Layout (target pattern)

```
apps/admin/src/
├── components/
├── hooks/
├── pages/                   # or features/ as domains grow
├── services/
├── App.tsx
└── main.tsx
```

### Mobile App Layout (Expo Router)

```
apps/mobile/
├── app/                     # File-based routes
│   ├── _layout.tsx
│   └── index.tsx
└── components/
```

---

## Shared Package Responsibilities

### `@commerceflow/config`

Shared developer tooling only. TypeScript `base` config, ESLint presets, Prettier. No runtime application code.

Apps extend configs via:

```js
// tsconfig.json
"extends": "@commerceflow/config/typescript/nextjs"  // or vite, expo
```

```js
// .eslintrc.cjs
extends: [require.resolve("@commerceflow/config/eslint/base")]
```

### `@commerceflow/types`

Single source of truth for domain models, API request/response shapes, and enums. No runtime logic. Published as compiled `dist/` via `tsc`.

### `@commerceflow/validation`

Zod schemas for every external boundary. Depends on `types`. Used by API route handlers and optionally client-side for form validation.

### `@commerceflow/api-client`

Typed HTTP client wrapping fetch (or axios in future). Consumes `types` for response typing. Used by admin and mobile — not by the API itself.

### `@commerceflow/utils`

Pure, framework-agnostic functions: formatting, date helpers, ID utilities, etc. No React, no Next.js, no React Native imports.

### `@commerceflow/ui`

Shared React components for **web apps only** (admin, future storefront). Foundation scaffold only until UI sprints. Mobile does not consume this package.

---

## Coding Standards

### TypeScript

- Strict mode enabled in all workspaces.
- No `any`; use `unknown` + narrowing or Zod at boundaries.
- Shared types before implementation.
- Exported public APIs have explicit return types.

### React (Admin)

- Functional components only.
- Custom hooks for reusable stateful logic.
- Props typed with interfaces.
- Data access via `@commerceflow/api-client`.

### React Native (Mobile)

- Expo Router conventions (`app/` directory).
- No dependency on `@commerceflow/ui`.
- Share logic via `utils`, `types`, `api-client`, `validation`.

### Next.js API

- App Router with `route.ts` handlers under `app/api/`.
- Validate all input with Zod from `@commerceflow/validation`.
- Return consistent JSON envelopes (see project rules).
- Server Components default; `"use client"` only when needed.

### Validation

- Zod schemas in `@commerceflow/validation`.
- `safeParse` at API boundaries; map to 400 errors.
- Align schemas with `@commerceflow/types`.

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Directories | kebab-case | `shopping-cart/` |
| Components | PascalCase file | `ProductCard.tsx` |
| Hooks | camelCase `use*` | `useCart.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Route files | Next.js lowercase | `route.ts`, `page.tsx` |

### Imports

1. External packages
2. `@commerceflow/*` workspace packages
3. Relative imports within the same app/feature

Use `import type` for type-only imports. Never import from another package's `src/`.

### Formatting and Linting

```bash
pnpm format        # Prettier write
pnpm format:check  # Prettier check
pnpm lint          # ESLint across workspaces
pnpm typecheck     # TypeScript across workspaces
```

---

## Review Checklist

Use this checklist for pull requests and self-review before requesting feedback.

### Architecture

- [ ] Business logic is in `apps/api`, not in admin or mobile
- [ ] No duplicate types; shared contracts in `@commerceflow/types`
- [ ] Zod schemas in `@commerceflow/validation`, not duplicated
- [ ] Changes scoped to current sprint; no unrelated refactors
- [ ] New dependencies justified and sprint-approved

### Type Safety

- [ ] No `any` introduced
- [ ] Strict TypeScript passes (`pnpm typecheck`)
- [ ] API responses match documented envelope shape

### Code Quality

- [ ] ESLint passes (`pnpm lint`)
- [ ] Prettier formatting consistent
- [ ] Functional components; hooks follow rules of hooks
- [ ] Error handling returns structured errors, not raw exceptions to clients
- [ ] No secrets or `.env` values committed

### Monorepo

- [ ] Workspace deps use `workspace:*` protocol
- [ ] Shared packages build before dependent apps
- [ ] No cross-package relative imports bypassing package exports

### Documentation

- [ ] ADR added if architectural decision changed
- [ ] `PROJECT_CONTEXT.md` updated if sprint status changed
- [ ] Public APIs or contracts documented inline or in types

---

## Definition of Done

A sprint task or user story is **done** when:

1. **Implemented** — Code meets acceptance criteria for the sprint deliverable.
2. **Typed** — TypeScript strict mode passes; shared types updated if contracts changed.
3. **Validated** — Input/output validated with Zod at API boundaries.
4. **Linted** — `pnpm lint` and `pnpm format:check` pass for affected workspaces.
5. **Built** — `pnpm build` succeeds for affected workspaces (when build is in scope for the sprint).
6. **Reviewed** — Review checklist satisfied; feedback addressed.
7. **Documented** — Sprint status, ADRs, or inline docs updated when behavior or architecture changes.
8. **Tested** — Automated tests pass when test infrastructure is in scope for the sprint (see Testing Expectations).
9. **Focused** — No scope creep into future sprints (auth, Prisma, Docker, etc. unless explicitly scheduled).

---

## Sprint Workflow

CommerceFlow development proceeds in numbered sprints. Each sprint has a single goal and explicit deliverables documented in `PROJECT_CONTEXT.md`.

### Sprint Lifecycle

1. **Plan** — Define goal, deliverables, and out-of-scope items in `PROJECT_CONTEXT.md`.
2. **Read context** — Review `PROJECT_CONTEXT.md`, relevant ADRs, `.cursor/project-rules.md`, and this playbook.
3. **Implement** — Work only within sprint scope; use shared packages correctly.
4. **Validate** — Run `pnpm typecheck`, `pnpm lint`, and other sprint-specific checks.
5. **Document** — Update sprint status, ADRs, and engineering docs as needed.
6. **Complete** — Mark sprint done in `PROJECT_CONTEXT.md`; commit with conventional message.

### Sprint Rules

- One sprint = one cohesive deliverable (e.g. bootstrap, auth, catalogue API).
- Do not start the next sprint's work in the current branch without approval.
- Deferred items (Prisma, PostgreSQL, Redis, Docker, CI, test runners) wait for their scheduled sprint.
- AI-assisted implementation follows approved architecture; escalate design questions before coding.

### Staged Install Order (bootstrap reference)

When adding or reinstalling dependencies:

1. Root workspace
2. Shared packages (`packages/*`)
3. `apps/api`
4. `apps/admin`
5. `apps/mobile` (last — largest dependency tree)

Stop immediately on install failure; do not regenerate successful stages.

---

## Git Workflow

### Branches

- `main` — stable, deployable history
- `feature/<short-description>` — sprint and feature work
- `fix/<short-description>` — bug fixes

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): imperative description

feat(api): add product list endpoint
fix(admin): correct pagination offset
chore(monorepo): bootstrap workspace foundation
docs(engineering): add engineering playbook
```

### Pull Requests

- One sprint feature or fix per PR when possible.
- PR description includes: summary, test plan, sprint reference.
- All CI checks must pass before merge (when CI is available).
- Squash or merge per team preference; keep `main` history clean.

### What Not to Commit

- `.env`, `.env.local`, credentials, API keys
- `node_modules/`, `dist/`, `.next/`, build artifacts
- IDE-specific files (covered by `.gitignore`)

---

## Testing Expectations

### Current State (Bootstrap Sprints)

Test runners and coverage thresholds are **deferred** until a dedicated testing sprint. During bootstrap:

- Manual smoke tests: dev servers start (`pnpm dev`)
- `pnpm typecheck` and `pnpm lint` are mandatory quality gates
- `pnpm build` validates compilation when in sprint scope

### Future Expectations

When test infrastructure is introduced:

| Layer | Tool (planned) | Scope |
|-------|----------------|-------|
| Unit | Vitest or Jest | Utils, validation, pure domain logic |
| API | Integration tests | Route handlers with test DB |
| Admin | React Testing Library | Components and hooks |
| Mobile | Jest + RNTL | Screens and hooks |
| E2E | Playwright / Detox | Critical user journeys |

### Testing Principles

- Every feature must be testable; design for testability from the start.
- Test behavior, not implementation details.
- Colocate tests with source: `module.test.ts` next to `module.ts`.
- API tests cover happy path, validation errors, and authorization (when auth exists).
- No tests that merely assert truthiness or snapshot entire components without purpose.

---

## Quick Reference

```bash
# Install (from repo root)
pnpm install

# Development
pnpm dev              # All apps via Turborepo

# Quality gates
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build

# Filter to one workspace
pnpm --filter api dev
pnpm --filter @commerceflow/types build
```

### Key Documents

| Document | Purpose |
|----------|---------|
| `PROJECT_CONTEXT.md` | Sprint status, architecture principles, developer context |
| `.cursor/project-rules.md` | Concise coding rules for AI and developers |
| `docs/adr/` | Architecture Decision Records |
| `README.md` | Project overview and stack summary |

---

*Last updated: Sprint 0.6 — Project Intelligence*
