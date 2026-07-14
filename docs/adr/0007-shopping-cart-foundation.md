# ADR 0007: Shopping Cart Aggregate

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.0–6.1 established store-scoped customer profiles and addresses. Checkout requires a pre-purchase holding area where customers can accumulate line items, adjust quantities, and review totals before committing to an order.

Sprint 6.2 introduces the Shopping Cart domain as a mutable pre-checkout aggregate.

## Decision

### Cart and CartItem entities

A dedicated `Cart` Prisma model and `@commerceflow/types` contract represent store-scoped shopping sessions:

| Field | Purpose |
|-------|---------|
| `id` | Primary key |
| `storeId` | Tenant boundary |
| `customerId` | FK → `Customer`; cart owner |
| `status` | `active`, `converted`, or `abandoned` |
| `subtotal` | Service-calculated cart total |
| `currency` | Derived from line item snapshots |
| `createdAt`, `updatedAt` | Audit timestamps |

`CartItem` lines capture mutable cart contents with price snapshots:

| Field | Purpose |
|-------|---------|
| `id` | Primary key |
| `cartId` | FK → `Cart` |
| `productVariantId` | FK → `ProductVariant` (traceability) |
| `quantity` | Mutable line quantity |
| `unitPriceSnapshot` | Variant price at add time |
| `currencySnapshot` | Variant currency at add time |
| `lineSubtotal` | `unitPriceSnapshot × quantity` |
| `createdAt`, `updatedAt` | Audit timestamps |

### Carts are separate from Orders

Carts and orders serve different lifecycle roles:

| Concern | Cart | Order |
|---------|------|-------|
| Mutability | Fully mutable while `active` | Immutable after confirmation |
| Purpose | Pre-purchase intent | Committed commercial record |
| Pricing | Snapshotted at add; quantity updates reuse snapshot | Snapshotted at creation; never changes |
| Inventory | No reservation or deduction | Reservations and fulfillment |
| Status | `active` → `converted` / `abandoned` | `draft` → `confirmed` → `fulfilled` / `cancelled` |

**Rationale for separation:**

1. **Browsing vs commitment.** Customers add, remove, and adjust items freely before checkout. Orders represent binding transactions.
2. **No inventory side effects.** Cart changes must not reserve or deduct stock (explicitly out of scope for Sprint 6.2).
3. **Price stability within session.** Snapshots at add time prevent surprise total changes if catalogue prices update mid-session; orders receive their own immutable snapshot at conversion.
4. **Independent lifecycles.** A cart can be abandoned without creating order noise; conversion produces a new immutable order aggregate.

### Mutable vs immutable aggregates

- **Cart (mutable):** Line quantities change; items are added and removed; `subtotal` and `currency` are recalculated by the service after every mutation.
- **Order (immutable):** Once confirmed, line items and totals are fixed. Future checkout will copy cart snapshot data into a new order — the cart does not become the order.

This follows the same snapshot philosophy as `OrderItem` (Sprint 4.0) and `CustomerAddress` order snapshotting (ADR 0006).

### Future checkout conversion strategy

A future checkout sprint will:

1. Validate the `active` cart (items in stock, customer profile complete, etc.).
2. Create an `Order` with `draft` or `confirmed` status from cart line snapshots.
3. Transition cart status to `converted`.
4. Optionally retain `sourceCartId` on the order for traceability.

The cart service and repository are designed so future customer self-service endpoints can call the same service methods. Staff APIs use `carts:read` / `carts:write` RBAC today; storefront endpoints may use customer-scoped auth without duplicating business logic.

### Business rules

- One `active` cart per customer per store (partial unique index).
- Duplicate variants merge by increasing quantity on the existing line.
- Price and currency snapshotted when a variant is first added; quantity updates reuse the existing snapshot.
- All cart items must share the same currency.
- Cart totals recalculated in the service/repository layer after every mutation.
- Only `active` carts are mutable.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/carts` | `carts:write` |
| GET | `/api/carts/:id` | `carts:read` |
| GET | `/api/customers/:id/cart` | `carts:read` |
| POST | `/api/carts/:id/items` | `carts:write` |
| PATCH | `/api/cart-items/:id` | `carts:write` |
| DELETE | `/api/cart-items/:id` | `carts:write` |

### Cross-cutting concerns

- **Domain events:** `cart.created`, `cart.item.added`, `cart.item.updated`, `cart.item.removed`.
- **Audit logging:** `cart` and `cart_item` entity types on administrative mutations.
- **RBAC:** `carts:read` granted to all staff roles; `carts:write` to owner, admin, manager, and staff.

### Explicitly out of scope (Sprint 6.2)

- Checkout and order conversion
- Payments
- Inventory reservation from cart
- Shipping and tax calculation

## Consequences

### Positive

- Clear boundary between browsing (cart) and commitment (order).
- Reuses established variant snapshot reader from orders domain.
- Service layer is auth-agnostic for future storefront reuse.
- Integrates with audit, events, and RBAC infrastructure.

### Negative / trade-offs

- `subtotal` and `currency` on cart are denormalized and must be kept in sync with items (handled in repository transactions).
- Cart does not auto-expire to `abandoned`; status transitions deferred to future sprint.
- Staff must know customer id to create carts; storefront get-or-create patterns deferred.

## References

- ADR 0006: Customer Address Aggregate
- ADR 0005: Customer Accounts Foundation
- ADR 0004: Domain Events Foundation
- Sprint 4.0: Order item product snapshot pattern
