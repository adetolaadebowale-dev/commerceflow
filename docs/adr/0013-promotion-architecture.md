# ADR 0013: Promotion Architecture

## Status

Accepted

## Date

2026-07-15

## Context

CommerceFlow needs a merchant-managed discount capability before checkout integration. Promotions define discount rules (percentage or fixed amount) with codes, validity windows, and lifecycle status. Marketing campaigns, loyalty programs, and automatic checkout application are deferred.

## Decision

### Promotion aggregate

| Field | Purpose |
|-------|---------|
| `storeId` | Tenant boundary |
| `name` | Merchant-facing label |
| `code` | Customer-facing coupon code (uppercase normalized) |
| `description` | Optional merchant notes |
| `type` | `percentage` or `fixed_amount` |
| `value` | Discount magnitude |
| `currency` | Required for fixed amount; null for percentage |
| `status` | Lifecycle: draft, active, inactive, expired |
| `startsAt` / `endsAt` | Validity window |
| `deletedAt` | Soft delete timestamp |

### Why discounts are separate from checkout

| Concern | Promotion domain | Checkout domain (future) |
|---------|------------------|--------------------------|
| Purpose | Define discount rules | Apply discounts to cart/order totals |
| Lifecycle | Merchant CRUD + status | Ephemeral calculation at checkout |
| Mutability | Managed over time | Snapshot at order creation |

Separating promotion management from checkout keeps discount definitions reusable, auditable, and independent of cart state.

### Business rules (Sprint 6.8)

| Rule | Enforcement |
|------|-------------|
| Code unique among active promotions | Partial unique index `(storeId, code) WHERE status = 'active' AND deleted_at IS NULL` |
| Percentage value > 0 and ≤ 100 | Validation + service |
| Fixed amount > 0 | Validation + service |
| Currency required for fixed amount | Validation + service |
| `startsAt` before `endsAt` | Validation + service |
| Code normalization | Uppercase on create/update |
| Soft delete | `deletedAt` set; excluded from queries |

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/promotions` | `promotions:write` |
| GET | `/api/promotions` | `promotions:read` |
| GET | `/api/promotions/:id` | `promotions:read` |
| PATCH | `/api/promotions/:id` | `promotions:write` |
| DELETE | `/api/promotions/:id` | `promotions:write` |

### RBAC

| Permission | owner/admin | manager | staff |
|------------|-------------|---------|-------|
| `promotions:read` | ✓ | ✓ | ✓ |
| `promotions:write` | ✓ | ✓ | ✗ |

### Domain events

| Event | When |
|-------|------|
| `promotion.created` | After creation |
| `promotion.updated` | After update |
| `promotion.deleted` | After soft delete |

### Audit logging

Entity type `promotion`; actions `create`, `update`, `delete`.

### Future coupon redemption

Checkout will validate an active promotion by code, verify the validity window, and compute the discount against cart subtotal. Redemption records (usage limits, per-customer caps) are a separate concern.

### Future promotion engine

A rules engine may evaluate stackable promotions, category-scoped discounts, and minimum-order thresholds. The promotion aggregate remains the source of truth for discount definitions.

### Future order-level application

Order totals will snapshot applied promotion details at checkout time, similar to how order items snapshot variant prices. Promotions will not mutate after order creation.

## Consequences

### Positive

- Merchants can manage discount codes before checkout integration
- Partial unique index allows code reuse after soft delete or status change
- Clear separation prepares checkout and accounting integration

### Negative

- No automatic expiry job; `expired` status is merchant-managed in this sprint
- No usage tracking or redemption limits yet

## References

- ADR-0008: Checkout Architecture
- ADR-0009: Payment Foundation
- Sprint 6.8 requirements
