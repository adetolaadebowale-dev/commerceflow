# CommerceFlow — Project Rules

Concise engineering rules for AI-assisted and human development in this monorepo.

Read `PROJECT_CONTEXT.md` and `docs/engineering/engineering-playbook.md` before implementing.

---

## Monorepo Architecture

- CommerceFlow is a **pnpm workspace monorepo** orchestrated by **Turborepo**.
- Applications live in `apps/`; shared code lives in `packages/`.
- Cross-stack changes belong in a single branch and should stay within one sprint scope.
- Do not introduce new top-level directories without an ADR or explicit sprint approval.
- Preserve official framework scaffolding patterns; extend rather than replace them.

---

## Workspace Package Usage

- Internal packages use the `@commerceflow/*` scope and `workspace:*` protocol.
- Apps depend on shared packages; shared packages must not depend on apps.
- Package dependency direction: `config` → `types` → `validation` / `utils` / `api-client` → `ui`.
- Build shared packages before apps (`turbo build` handles upstream `^build` ordering).
- Add workspace dependencies explicitly in `package.json`; never import across packages via relative paths outside the workspace.

| Package | Use for |
|---------|---------|
| `@commerceflow/config` | TypeScript, ESLint, Prettier presets only |
| `@commerceflow/types` | Shared TypeScript types and interfaces |
| `@commerceflow/validation` | Zod schemas derived from or aligned with types |
| `@commerceflow/api-client` | Typed HTTP client for API consumption |
| `@commerceflow/utils` | Pure, framework-agnostic utilities |
| `@commerceflow/ui` | Shared React components (web only; not used by mobile) |

---

## Shared Types First

- Define domain and API contracts in `@commerceflow/types` before implementation.
- Derive Zod schemas in `@commerceflow/validation` from or alongside those types.
- Apps and API routes consume shared types; do not redefine the same shape locally.
- When a type changes, update types → validation → api-client → consumers in the same sprint.

---

## No Duplicate Business Logic

- **Business logic lives in `apps/api` only.**
- Admin and mobile are presentation and orchestration layers; they call the API.
- Do not reimplement pricing, inventory, auth, or checkout rules in client apps.
- Extract reusable **pure** logic to `@commerceflow/utils`; extract reusable **contracts** to `@commerceflow/types`.

---

## Strict TypeScript

- TypeScript is required across all workspaces.
- Extend `@commerceflow/config/typescript/base` (or the app-specific variant).
- Enable strict mode; do not disable compiler checks to silence errors.
- Prefer explicit return types on exported functions and public APIs.
- Use `satisfies`, discriminated unions, and `as const` where they improve safety.
- No `@ts-ignore` without a comment explaining why and a follow-up ticket.

---

## Avoid `any`

- Do not use `any` in new code.
- Prefer `unknown` with narrowing, generics, or Zod parsing at boundaries.
- If a third-party type is incomplete, wrap it in a narrow adapter rather than casting to `any`.

---

## Functional React Components

- Use function components exclusively; no class components.
- One component per file for non-trivial components.
- Props are typed with an explicit interface or type alias.
- Prefer composition over prop drilling; extract hooks for reusable stateful logic.
- Keep components focused: render UI, delegate logic to hooks or services.

---

## React Hooks Best Practices

- Call hooks only at the top level of function components or custom hooks.
- Custom hooks are named `useXxx` and live in `hooks/` when shared within an app.
- Memoize (`useMemo`, `useCallback`) only when profiling or preventing measurable re-render cost.
- Side effects belong in `useEffect` with correct dependency arrays; avoid stale closures.
- Data fetching in admin uses the API client; do not embed raw fetch logic in leaf components.

---

## React Native Conventions

- `apps/mobile` uses **Expo Router** (`app/` directory).
- Mobile does **not** depend on `@commerceflow/ui`; use React Native primitives and mobile-specific patterns.
- Prefer platform-agnostic logic in `@commerceflow/utils` and `@commerceflow/api-client`.
- Follow Expo and Metro monorepo guidance for workspace package resolution.
- Use functional components and hooks consistent with the admin app, adapted for RN APIs.

---

## Next.js App Router Conventions

- `apps/api` uses the **App Router** (`src/app/`).
- Route handlers live in `route.ts` files under `app/api/`.
- Server Components are the default; add `"use client"` only when client interactivity is required.
- Colocate route-specific modules under the route segment; shared API logic under `src/lib/` or domain folders.
- Configure `transpilePackages` for `@commerceflow/*` workspace imports.
- API routes validate input with Zod schemas from `@commerceflow/validation`.

---

## API Response Conventions

- All JSON responses follow a consistent envelope:

```ts
// Success
{ "data": T, "meta"?: { ... } }

// Error
{ "error": { "code": string, "message": string, "details"?: unknown } }
```

- Use appropriate HTTP status codes (400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 500 internal).
- Error `code` values are stable, machine-readable strings (e.g. `CATALOGUE_PRODUCT_NOT_FOUND`).
- Never expose stack traces or internal implementation details in production responses.
- Paginated list endpoints include `meta` with `page`, `pageSize`, `total`, and `hasMore` where applicable.

---

## Zod Validation

- All external input (request bodies, query params, env vars) is validated with Zod.
- Schemas live in `@commerceflow/validation`; import them in API route handlers.
- Parse with `safeParse`; map failures to 400 responses using the API error envelope.
- Share inferred types via `z.infer<typeof Schema>` or parallel definitions in `@commerceflow/types`.
- Do not duplicate schema definitions across apps.

---

## Folder Naming Conventions

- Use **lowercase kebab-case** for directories: `shopping-cart`, `order-history`.
- Domain folders in the API mirror business domains: `catalogue`, `checkout`, `orders`.
- Group by feature within domains, not by technical layer alone.
- Standard app layout:
  - `apps/api/src/app/` — routes and route handlers
  - `apps/api/src/lib/` — shared server utilities
  - `apps/admin/src/` — Vite entry, pages, components, hooks
  - `apps/mobile/app/` — Expo Router screens

---

## File Naming Conventions

- React components: **PascalCase** — `ProductCard.tsx`.
- Hooks: **camelCase** with `use` prefix — `useCart.ts`.
- Utilities and services: **camelCase** — `formatCurrency.ts`, `orderService.ts`.
- Next.js route files: lowercase — `route.ts`, `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
- Types-only files: **camelCase** or `*.types.ts` — `product.types.ts`.
- Test files: `*.test.ts` or `*.test.tsx` colocated with the module under test.

---

## Import Conventions

- Order: external packages → `@commerceflow/*` workspace packages → relative imports.
- Use named exports; avoid default exports except where a framework requires them (e.g. Next.js `page.tsx`).
- Import types with `import type { ... }` when type-only.
- Do not import from another package's `src/`; use package entry points (`@commerceflow/types`).
- No deep relative paths crossing feature boundaries (prefer workspace packages or aliases).

---

## Error Handling Conventions

- API: catch at route boundary; log internally; return structured error envelope.
- Validation errors: 400 with field-level `details` when helpful.
- Client apps: handle API errors via the typed client; surface user-friendly messages.
- Use typed error classes or codes; avoid string-matching generic `Error.message`.
- Fail fast on invalid config or missing env at startup (server) or module init (client).

---

## Conventional Git Commits

- Format: `type(scope): description`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`
- Scope examples: `api`, `admin`, `mobile`, `types`, `validation`, `monorepo`
- Use imperative mood: `add cart validation`, not `added cart validation`.
- One logical change per commit; body optional for non-obvious context.

---

## Keep Changes Focused to One Sprint

- Implement only what the current sprint deliverable requires.
- Do not add Prisma, auth, UI libraries, Docker, or CI unless the sprint explicitly includes them.
- Do not refactor unrelated code while delivering a feature.
- If scope grows, document it and split to a follow-up sprint rather than expanding in place.
- Update `PROJECT_CONTEXT.md` sprint status when a sprint completes.

---

## Before You Ship

- `pnpm typecheck` and `pnpm lint` pass for affected workspaces.
- No new dependencies without sprint approval.
- No secrets committed; use `.env.local` (gitignored).
- AI implements approved architecture — it does not redesign it.
