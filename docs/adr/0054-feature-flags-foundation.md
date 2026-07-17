# ADR 0054: Feature Flags Foundation

## Status

Accepted

## Date

2026-07-17

## Context

CommerceFlow needs a lightweight way to enable or disable platform capabilities per organization and store during controlled rollouts. Sprint 11.5 introduces configuration-scoped feature flags without experimentation, targeting, or percentage rollouts.

## Decision

### Module layout

Feature flag infrastructure lives in `apps/api/src/feature-flags/`:

```
feature-flags/
├── repositories/       # Prisma + memory
├── services/           # FeatureFlagService
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/feature-flags/`
- `packages/validation/src/feature-flags/`
- `packages/api-client/src/feature-flags/`

### Prisma model

| Model | Table | Purpose |
|-------|-------|---------|
| `FeatureFlag` | `feature_flags` | Scoped enablement for a feature key |

Scopes: `platform`, `organization`, `store`.

Uniqueness is enforced with partial unique indexes so there is only one active flag per scope/key combination:

- Platform: unique on `key`
- Organization: unique on `(organization_id, key)`
- Store: unique on `(store_id, key)`

### Precedence

Effective flag resolution for a store uses:

1. Store flag
2. Organization flag
3. Platform flag
4. Default (`enabled: false`) when no configuration exists

Organization flags override platform flags. Store flags override organization flags.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/feature-flags` | `feature-flags:read` |
| GET | `/api/feature-flags/effective` | `feature-flags:read` |
| PUT | `/api/feature-flags/:key` | `feature-flags:write` |

List returns configured flags visible to the store context. Effective resolves precedence for one or more keys. PUT upserts a flag at the requested scope.

### RBAC

| Permission | owner/admin | manager | staff |
|------------|-------------|---------|-------|
| `feature-flags:read` | yes | yes | yes |
| `feature-flags:write` | yes | no | no |

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `feature-flag.updated` | `feature_flag` |

Audit entity: `feature_flag`. Action: `update`.

## Consequences

### Positive

- Teams can gate capabilities at platform, organization, or store scope with a clear override model.
- Shared types, validation, and API client keep consumers aligned with the API.
- Domain events and audit provide observability for configuration changes.

### Negative

- No targeting beyond scope means finer-grained cohorts require future work.
- Platform flags are globally visible; misuse can affect all tenants.

### Out of scope (explicit)

- Percentage rollouts
- User or segment targeting
- A/B testing and experimentation
- Scheduled activation
- Analytics or remote configuration services
