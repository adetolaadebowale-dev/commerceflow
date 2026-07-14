# ADR 0003: Audit Logging Foundation

## Status

Accepted

## Date

2026-07-14

## Context

CommerceFlow enforces store-scoped authorization (ADR 0002) for administrative operations across catalogue, inventory, orders, reservations, and fulfillment. There was no durable record of who performed mutating actions, when they occurred, or what entity was affected.

Sprint 5.1 introduces an immutable audit logging subsystem for authenticated business operations. Analytics, event streaming, and general user activity tracking outside business mutations are explicitly out of scope.

## Decision

### AuditLog model

Append-only `AuditLog` records are persisted with:

| Field | Purpose |
|-------|---------|
| `id` | Primary key |
| `storeId` | Tenant boundary (nullable for future platform-wide events) |
| `userId` | Authenticated actor |
| `sessionId` | Session that performed the action |
| `entityType` | Domain entity (`brand`, `order`, etc.) |
| `entityId` | Affected entity identifier |
| `action` | Administrative action (`create`, `confirm`, `fulfill`, etc.) |
| `metadata` | Optional JSON payload with action-specific context |
| `createdAt` | Immutable timestamp |

No `updatedAt` or `deletedAt` fields. Repository interfaces expose only `create`, `findById`, and `list`.

### Entity types and actions

Entity types and actions are defined as stable const arrays in `@commerceflow/types` and validated via `@commerceflow/validation`.

Recorded operations in Sprint 5.1:

| Domain | Actions audited |
|--------|-----------------|
| Catalogue | brand/category/product create, update; brand delete |
| Inventory | inventory item create; stock adjustment |
| Orders | confirm, cancel |
| Fulfillment | fulfill |
| Reservations | release |

### Transaction model: post-commit best-effort

Audit entries are written **after** the business operation succeeds, in a **separate persistence call** from the domain transaction.

Flow:

1. Route validates input and authorizes the request.
2. Domain service completes the business mutation (existing transactional boundaries unchanged).
3. Route calls `AuditService.recordFromAuthContext()` which invokes `recordBestEffort()`.
4. On audit write failure, the error is logged via `onRecordFailure` and **not** propagated to the client.

**Rationale:**

- Business correctness must not depend on audit infrastructure availability.
- Domain services already use focused repository transactions (e.g. inventory adjustments, order transitions). Coupling audit writes into every domain transaction would widen blast radius and complicate memory-repository tests.
- A failed audit write after a successful mutation is observable via server logs and can be reconciled operationally; rolling back a fulfilled order because audit insert failed would corrupt business state.

**Trade-off:** Audit and business state can briefly diverge if the audit insert fails after commit. This is acceptable for Sprint 5.1; future work may add outbox/retry without changing route handler contracts.

### Read access

- `GET /api/audit-logs` — paginated, filterable list
- `GET /api/audit-logs/:id` — single entry by id

Both require `audit:read` permission, granted to `owner`, `admin`, and `manager` — not `staff`.

### Architecture placement

| Layer | Responsibility |
|-------|----------------|
| Routes | Authorize, invoke domain service, record audit post-success |
| `AuditService` | Append entries, list/get with tenant scoping |
| `AuditLogRepository` | Prisma (runtime) and memory (tests) |
| Domain services | Unchanged business logic |

Audit recording is intentionally at the **route boundary** alongside authorization, using `AuthorizedStoreContext` for actor fields.

## Consequences

### Positive

- Administrative actions leave a durable, immutable trail.
- Business transactions are isolated from audit failures.
- Audit behavior is unit-testable with memory repositories.
- Read API supports operational investigation with tenant isolation.

### Negative / trade-offs

- Audit is eventually consistent with business commits (post-commit model).
- Routes must call `recordFromAuthContext` after each audited mutation (convention + review).
- No update/delete APIs by design; corrections require new entries or operational tooling.

## Future extension points

- **Outbox / retry queue** for guaranteed audit delivery without blocking business responses.
- **Same-transaction audit** for specific high-compliance flows via optional repository hook.
- **Platform-wide events** using nullable `storeId`.
- **Export / analytics pipeline** (separate from this append-only store).
- **Audit on additional mutations** (e.g. order create, reservation create) as policies evolve.

## References

- `apps/api/src/audit/`
- `packages/types/src/audit/`
- `apps/api/prisma/schema.prisma` (`AuditLog`)
- ADR 0002 — Store Authorization and Permission Model
