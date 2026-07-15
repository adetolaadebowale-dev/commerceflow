# ADR 0014: Promotion Redemption Architecture

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.8 introduced merchant-managed Promotion definitions. Sprint 6.9 connects those definitions to active shopping carts and checkout without modifying the Promotion aggregate itself.

Checkout must produce historically correct orders even when live promotions change after order creation.

## Decision

### Promotion vs Redemption

| Layer | Responsibility |
|-------|----------------|
| **Promotion** (Sprint 6.8) | CRUD for discount definitions — codes, types, validity windows |
| **Promotion Redemption** (Sprint 6.9) | Applying promotions to carts, calculating discounts, snapshotting at checkout |

Redemption references `promotionId` but stores its own snapshots on `CartPromotion` and `OrderAppliedPromotion`.

### CartPromotion model

One applied promotion per cart (`@@unique([cartId])`). Replacing a code upserts the existing record.

Snapshots captured at apply time:
- `promotionCodeSnapshot`
- `promotionTypeSnapshot`
- `promotionValueSnapshot`
- `discountAmount` (recalculated when cart subtotal changes)

### Snapshot philosophy

| Stage | Source of truth |
|-------|-----------------|
| Apply | Live promotion validated (active, in date window) |
| Cart mutations | Stored snapshots + current cart subtotal |
| Checkout | Stored cart snapshots + recalculated line subtotals |
| Order | Immutable `OrderAppliedPromotion` child record |

Orders never re-read live promotion rows after creation.

### Order totals

| Field | Meaning |
|-------|---------|
| `subtotal` | Sum of line item subtotals (pre-discount) |
| `discountAmount` | Promotion discount applied |
| `total` | Payable amount (`subtotal - discountAmount`) |

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/carts/:id/apply-promotion` | `carts:write` |
| DELETE | `/api/carts/:id/promotion` | `carts:write` |
| GET | `/api/carts/:id` | `carts:read` (includes applied promotion) |

### Domain events

| Event | When |
|-------|------|
| `promotion.applied` | After successful cart apply |
| `promotion.removed` | After promotion removed from cart |

### Audit logging

Entity type `promotion_redemption`; actions `apply`, `remove`.

### Future multi-promotion engine

The one-promotion-per-cart constraint is intentional for Sprint 6.9. A future engine may introduce stacking rules, priority ordering, and per-line discounts without changing the snapshot model.

### Future customer eligibility

Customer segment restrictions, usage limits, and per-customer caps will be enforced in the redemption layer without modifying promotion definitions.

## Consequences

### Positive

- Orders remain historically accurate when promotions change
- Promotion aggregate stays focused on merchant configuration
- Checkout discount math uses the same pricing utilities as line items

### Negative

- Payment and invoice services still reference `order.subtotal` — future sprints should use `order.total`
- No automatic promotion expiry job removes stale cart applications

## References

- ADR-0013: Promotion Architecture
- ADR-0008: Checkout Architecture
