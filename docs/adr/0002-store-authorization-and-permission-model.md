# ADR 0002: Store Authorization and Permission Model

## Status

Accepted

## Date

2026-07-14

## Context

CommerceFlow is multi-tenant with **Store** as the operational boundary. Prior to Sprint 5.0, business endpoints accepted a client-supplied `storeId` without verifying that the caller belonged to that store or had permission to perform the action. Authentication existed for identity endpoints, but store-scoped authorization was missing.

Sprint 5.0 introduces staff/store authorization only. Customer permissions, OAuth, SSO, and organization-wide permission inheritance are explicitly out of scope.

## Decision

### Store roles

Store membership is modeled with `StoreMember.role` using the `StoreRole` enum:

| Role | Purpose |
|------|---------|
| `owner` | Full store access; intended for store proprietors |
| `admin` | Full operational access within a store |
| `manager` | Day-to-day catalogue, inventory, order, reservation, and fulfillment operations |
| `staff` | Read-heavy access with limited order creation |

Roles are store-scoped and independent of platform `UserRole` (customer/staff/admin/super_admin).

### Permission model

Permissions are defined as stable string codes in `@commerceflow/types`:

- `catalogue:read`, `catalogue:write`
- `inventory:read`, `inventory:write`
- `orders:read`, `orders:write`, `orders:lifecycle`, `orders:fulfill`
- `reservations:manage`

The mapping from `StoreRole` → permissions lives in a single policy module:

`apps/api/src/authorization/policies/store-permission.policy.ts`

### Authorization flow

1. Route handler validates input (Zod) and extracts `storeId`.
2. Route handler calls `AuthorizationService.authorizeStoreRequest(request, storeId, permission)`.
3. `AuthorizationService`:
   - Resolves the Bearer access token via `AuthService.resolveAuthenticatedSession()`
   - Loads active `StoreMember` for `(storeId, userId)`
   - Checks permission via `StorePermissionPolicy`
4. On success, returns `AuthorizedStoreContext` (`userId`, `sessionId`, `storeId`, `storeRole`, `permission`).
5. On failure:
   - Missing/invalid token → `401` (`AuthError`)
   - Not a store member → `403` (`AUTHORIZATION_STORE_ACCESS_DENIED`)
   - Insufficient role → `403` (`AUTHORIZATION_INSUFFICIENT_PERMISSION`)

Authorization is enforced at the **route boundary**. Domain services remain focused on business logic and continue to scope data access by `storeId` from validated input.

### Repository support

`StoreMemberRepository.findActiveMembership(storeId, userId)` is the only persistence port required for authorization in this sprint. Prisma and memory implementations are provided for runtime and unit tests.

## Rationale

- **Centralized policy**: Permission matrices are not duplicated across catalogue, inventory, order, reservation, or fulfillment modules.
- **Route-layer enforcement**: Keeps services testable without auth wiring and ensures every protected endpoint follows the same gate.
- **Store-scoped roles separate from platform roles**: A platform `UserRole` does not imply access to any store; membership must exist per store.
- **Explicit permission codes**: Stable contracts for future admin UI, API client tooling, and audit logging.

## Consequences

### Positive

- Protected endpoints no longer trust `storeId` alone.
- Authorization behavior is unit-testable with memory repositories.
- Adding a new protected action requires one policy entry and one route-level permission constant.

### Negative / trade-offs

- Every protected route must remember to call authorization (convention + tests; no global middleware yet).
- JWT access tokens still carry platform role only; store role is resolved from the database per request.
- `admin` store role was added to Prisma via migration to match the sprint role model.

## Future extension points

- **Customer store permissions**: Separate policy namespace; do not reuse staff permission codes.
- **Organization inheritance**: Could resolve effective permissions from `Organization` → `Store` hierarchy without changing route handler shape.
- **Middleware / decorator**: Wrap `authorizeStoreRequest` in Next.js middleware once route metadata is standardized.
- **Member management APIs**: CRUD on `StoreMember` with `owner`-only or `admin`-only guards.
- **Permission audit trail**: Log `AuthorizedStoreContext` on mutating operations.
- **Caching membership**: Optional short-lived cache keyed by `(storeId, userId)` if lookup cost becomes material.

## References

- `apps/api/src/authorization/`
- `packages/types/src/authorization/`
- `apps/api/prisma/schema.prisma` (`StoreMember`, `StoreRole`)
- Sprint 5.0 implementation report
