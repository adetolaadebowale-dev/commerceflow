# ADR 0008: Checkout Architecture

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.2 introduced mutable shopping carts as a pre-purchase holding area. Sprint 6.0–6.1 established customer profiles and reusable addresses. CommerceFlow now needs a checkout step that converts purchase intent (cart) into a committed commercial record (order) without payment processing.

Sprint 6.3 implements checkout foundation: cart → draft order conversion with immutable snapshots.

## Decision

### Checkout as a dedicated orchestration service

`CheckoutService` coordinates cart, customer, address, and order persistence without duplicating domain logic in routes. A dedicated `CheckoutRepository` performs the cart-to-order conversion in a **single database transaction**.

### Mutable cart → immutable order

| Stage | Aggregate | Mutability |
|-------|-----------|------------|
| Pre-checkout | `Cart` + `CartItem` | Mutable while `active` |
| Post-checkout | `Order` + `OrderItem` | Immutable line snapshots; draft status allows lifecycle transitions only |

Checkout does not mutate the cart into an order. It **creates a new order** from cart data and marks the cart `converted`. The cart record remains for audit/history but cannot be checked out again.

### Address snapshotting

Orders store an embedded `OrderAddressSnapshot` (recipient, phone, address lines, city, state/province, postal code, country code) captured at checkout time.

**Rationale:**

1. Customer addresses are mutable CRM records (ADR 0006).
2. Fulfilled orders must reflect the address *at purchase time*.
3. No FK to `CustomerAddress` after checkout — the order owns its shipping data.

The checkout request includes `customerAddressId` for validation only; the resulting order stores copied fields, not a live reference.

### Totals recalculation

Checkout **does not copy `cart.subtotal`**. The service:

1. Reads cart line quantities and price snapshots.
2. Recalculates each `lineSubtotal` via `multiplyPrice(unitPriceSnapshot, quantity)`.
3. Sums line subtotals into `order.subtotal`.

This prevents stale or tampered cart header totals from affecting orders while preserving per-line price snapshots the customer saw during cart editing.

### Order linkage fields

| Field | Purpose |
|-------|---------|
| `customerProfileId` | FK → `Customer` (store-scoped CRM profile) |
| `sourceCartId` | Optional traceability to originating cart |
| `shipping*` fields | Embedded address snapshot |

Existing `Order.customerId → User` remains for platform identity bridge; checkout populates `customerProfileId`.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/carts/:id/checkout` | `carts:write` |

Request body: `{ customerAddressId }`  
Query: `storeId`

Response: `{ data: { order, cart } }`

### Domain events

- `checkout.completed` — emitted after successful transaction with order and converted cart payloads.

### Audit logging

- Entity type: `checkout`
- Action: `checkout`
- Metadata: `cartId`, `orderId`, `customerProfileId`, `customerAddressId`, totals

### Payment intentionally deferred

Checkout creates a **draft order** only. No payment capture, gateway integration, or payment status fields are introduced. This keeps the order lifecycle (confirm → reserve → fulfill) independent of payment provider choice in future sprints.

## Consequences

### Positive

- Atomic cart conversion prevents orphaned orders or double checkout.
- Address and line item immutability from order creation.
- Clear boundary before payment and inventory side effects.
- Reuses cart RBAC; service layer ready for storefront reuse.

### Negative / trade-offs

- Shipping address embedded on `Order` (denormalized) rather than separate aggregate.
- Draft orders from checkout require explicit confirmation in later lifecycle steps.
- No inventory validation at checkout (deferred).

## References

- ADR 0007: Shopping Cart Foundation
- ADR 0006: Customer Address Aggregate
- ADR 0005: Customer Accounts Foundation
- Sprint 4.0: Order item product snapshot pattern
