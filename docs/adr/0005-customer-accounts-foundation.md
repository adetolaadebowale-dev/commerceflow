# ADR 0005: Customer Accounts Foundation

## Status

Accepted

## Date

2026-07-15

## Context

Phase 1 established the merchant platform foundation: catalogue, inventory, orders, authorization, audit logging, and domain events. Orders currently reference an optional `customerId` FK to platform `User`, but merchants need store-scoped customer profiles for CRM, order attribution, and future storefront checkout — independent of staff authentication accounts.

Sprint 6.0 introduces the Customer aggregate as the first Phase 2 domain.

## Decision

### Customer aggregate

A dedicated `Customer` Prisma model and `@commerceflow/types` contract represent store-scoped customer profiles:

| Field | Purpose |
|-------|---------|
| `id` | Primary key |
| `storeId` | Tenant boundary |
| `email` | Contact email, unique per active store record |
| `firstName`, `lastName` | Profile name |
| `phone` | Optional contact number |
| `status` | `active` or `inactive` |
| `createdAt`, `updatedAt` | Audit timestamps |
| `deletedAt` | Soft delete |

### Separate from User

Platform `User` (Identity domain) exists for authentication:

- `passwordHash`, `UserRole`, `Session` — staff/customer login infrastructure
- Global email uniqueness
- Not store-scoped

`Customer` exists for merchant-managed profiles:

- Store-scoped email uniqueness (partial unique index where `deleted_at IS NULL`)
- No authentication fields
- Managed via `customers:read` / `customers:write` store permissions

**Rationale for separation:**

1. A staff member (`User`) is not a store customer profile.
2. A guest customer may exist without a platform login.
3. One `User` could theoretically link to multiple store customer profiles in future without conflating identity with CRM data.
4. Store permissions (`customers:*`) remain separate from platform `UserRole` per ADR 0002.

`Order.customerId → User` remains as an interim bridge; future sprints may introduce `Order.customerProfileId → Customer`.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/customers` | `customers:write` |
| GET | `/api/customers` | `customers:read` |
| GET | `/api/customers/:id` | `customers:read` |
| PATCH | `/api/customers/:id` | `customers:write` |

Soft delete is supported at the service/repository layer but not exposed as a public DELETE endpoint in Sprint 6.0.

### Cross-cutting concerns

- **Domain events:** `customer.created`, `customer.updated` emitted from `CustomerService` after successful mutations.
- **Audit logging:** `customer` entity type; create/update recorded at route boundary with actor context.
- **RBAC:** `customers:read` granted to `owner`, `admin`, `manager`, and `staff`; `customers:write` to `owner`, `admin`, `manager` only.

## Consequences

### Positive

- Clear separation between identity and customer CRM data.
- Store-scoped uniqueness and tenant isolation from day one.
- Integrates with existing audit, events, and authorization infrastructure.

### Negative / trade-offs

- `Order.customerId` still points to `User` until a later sprint links orders to `Customer`.
- No customer-facing self-service or authentication in Sprint 6.0.
- Soft delete not exposed via REST (service-layer only).

## Future extension points

- Link `Order` to `Customer` profile
- Optional `userId` FK on `Customer` for authenticated shoppers
- Customer-facing registration and login (separate from staff auth)
- `DELETE /api/customers/:id` or status-driven archival API
- Customer segments, tags, and marketing preferences

## References

- `apps/api/src/customers/`
- `packages/types/src/customers/`
- `apps/api/prisma/schema.prisma` (`Customer`, `CustomerStatus`)
- ADR 0002 — Store Authorization and Permission Model
- ADR 0003 — Audit Logging Foundation
- ADR 0004 — Domain Events Foundation
