# ADR 0050: Store Administration & Configuration

## Status

Accepted

## Date

2026-07-17

## Context

CommerceFlow business domains operate within a **Store** boundary. Store records existed in Prisma with profile fields (name, slug) but lacked a structured configuration surface for operational defaults such as currency, timezone, and locale.

Sprint 11.1 introduces controlled store-level administration APIs while preserving the existing store authorization model. Taxation, billing, themes, branding, feature flags, and localization packs remain out of scope.

## Decision

### Module layout

Store administration lives in `apps/api/src/store-administration/`:

```
store-administration/
├── repositories/       # Prisma + memory
├── services/           # StoreAdministrationService
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/stores/` — `StoreSettings`, `StoreConfiguration`, defaults
- `packages/validation/src/stores/` — param and update schemas
- `packages/api-client/src/stores/` — HTTP client

### Prisma extension

`Store.settings` JSON column defaults to `{}`. Persisted keys in this sprint:

| Key | Purpose |
|-----|---------|
| `defaultCurrency` | ISO 4217 currency code (defaults to `USD`) |
| `defaultTimezone` | IANA timezone identifier (defaults to `UTC`) |
| `locale` | BCP 47-style locale tag (defaults to `en-US`) |

Missing or invalid JSON values fall back to `DEFAULT_STORE_SETTINGS` at read time.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/stores/:id/settings` | `stores:read` |
| PATCH | `/api/stores/:id/settings` | `stores:write` |

PATCH accepts optional profile fields (`name`, `slug`) and settings fields (`defaultCurrency`, `defaultTimezone`, `locale`). At least one field is required.

### RBAC

New store permission codes:

- `stores:read` — owner, admin, manager, staff
- `stores:write` — owner, admin, manager

Authorization reuses `AuthorizationService.authorizeStoreRequest()` with the existing store membership model. No cross-store access is permitted.

### Slug uniqueness

Store slugs remain unique per organization (`@@unique([organizationId, slug])`). Updates validate slug conflicts within the same organization before persistence.

### Domain events and audit

- Domain event: `store.settings.updated` (`storeId` set to the updated store)
- Audit entity: `store`, action: `update_settings`

## Consequences

### Positive

- Store operators can manage profile and operational defaults through shared contracts and REST APIs.
- Settings are extensible via JSON without schema migrations for future sprint additions.
- Store boundary and RBAC model remain unchanged for all other domains.

### Negative

- Settings validation is limited to the three fields in this sprint; richer configuration will require additional schemas.
- Locale validation accepts `ll` or `ll-RR` forms only; full BCP 47 tags are deferred.

### Out of scope (explicit)

- Tax configuration
- Billing and subscription settings
- Themes and branding
- Feature flags
- Localization packs
