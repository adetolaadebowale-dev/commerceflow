# ADR 0049: Organization Administration Foundation

## Status

Accepted

## Date

2026-07-17

## Context

CommerceFlow uses **Organization** as the tenant boundary above **Store**. Organization and Store models existed in Prisma as persistence-only records while all business domains remained store-scoped. Sprint 11.0 introduces organization-level administration APIs without changing store-scoped business behavior.

Billing, subscriptions, SSO, invitations, and multi-organization user management remain out of scope.

## Decision

### Module layout

Organization administration lives in `apps/api/src/organizations/`:

```
organizations/
├── repositories/       # Prisma + memory
├── services/           # OrganizationService
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/organizations/` — `Organization`, `OrganizationStoreSummary`, settings placeholder
- `packages/validation/src/organizations/` — update and param schemas
- `packages/api-client/src/organizations/` — HTTP client

### Prisma extension

`Organization.settings` JSON column defaults to `{}` as a placeholder for future configuration expansion. No billing or subscription fields are added.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/organizations/:id` | `organizations:read` |
| PATCH | `/api/organizations/:id` | `organizations:write` |
| GET | `/api/organizations/:id/stores` | `organizations:read` |

### Business capabilities

| Capability | Behavior |
|------------|----------|
| Retrieve organization | Returns name, slug, settings placeholder, timestamps |
| Update profile | Updates name and/or slug with uniqueness validation |
| List stores | Returns store summaries belonging to the organization |
| Settings placeholder | Empty object by default; no mutation endpoint in this sprint |

### RBAC

New organization permission codes:

- `organizations:read` — owner, admin, manager, staff (via store membership)
- `organizations:write` — owner, admin only

Authorization derives from **existing store memberships** within the organization's stores. No separate `OrganizationMember` model is introduced. `AuthorizationService.authorizeOrganizationRequest()` selects the highest store role across memberships and evaluates `OrganizationPermissionPolicy`.

Store-scoped business modules and permissions are unchanged.

### Domain events and audit

- Domain event: `organization.updated` (`storeId: null`)
- Audit entity: `organization`, action: `update` (`storeId: null`, `organizationId` in metadata)

## Consequences

### Positive

- Organization metadata is accessible through shared contracts and REST APIs.
- Store-scoped architecture is preserved; no business aggregates move to organization scope.
- Authorization reuses store membership data without duplicating role storage.

### Negative / deferred

- Users without store membership cannot access organization APIs even if they should at org level.
- Settings placeholder is read-only until a future sprint adds mutation endpoints.
- Billing, SSO, invitations, and org-wide user management remain unimplemented.

## References

- ADR 0002: Store Authorization and Permission Model
- ADR 0003: Audit Logging Foundation
