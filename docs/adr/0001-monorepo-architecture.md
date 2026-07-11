# ADR 0001: Monorepo Architecture

## Status

Accepted

## Date

2026-07-10

## Context

CommerceFlow is an enterprise-grade headless ecommerce platform consisting of a backend API, administrative dashboard, and customer mobile application. These applications share types, validation schemas, API contracts, and development tooling.

## Decision

CommerceFlow uses a **pnpm workspace monorepo** orchestrated by **Turborepo**, with shared functionality in internal `packages/`.

### Why a Monorepo

- Atomic cross-stack changes in a single commit
- Consistent TypeScript, ESLint, and Prettier tooling
- Internal packages linked via `workspace:*` without publishing

### Why pnpm

- Disk-efficient content-addressable storage
- Strict dependency isolation preventing phantom dependencies
- Native workspace protocol support

### Why Turborepo

- Task orchestration with upstream build dependencies (`^build`)
- Local caching for build, lint, and typecheck tasks
- Parallel dev server execution across apps

### Why Shared Packages

| Package | Responsibility |
|---------|---------------|
| `@commerceflow/config` | Shared TypeScript, ESLint, Prettier presets |
| `@commerceflow/types` | Domain and API TypeScript types |
| `@commerceflow/validation` | Zod schemas |
| `@commerceflow/api-client` | Typed HTTP client |
| `@commerceflow/utils` | Pure utilities |
| `@commerceflow/ui` | Shared React components (foundation only) |

## Consequences

### Positive

- Single repository for the full stack
- Type-safe workspace imports
- Official framework tooling preserved via CLI scaffolding

### Negative

- Expo requires Metro monorepo configuration
- Next.js requires `transpilePackages` for workspace imports

### Deferred

- Prisma/PostgreSQL, UI components, CI/CD, test runners
