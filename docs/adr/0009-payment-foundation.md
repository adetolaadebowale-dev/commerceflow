# ADR 0009: Payment Foundation

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.3 introduced checkout, converting active carts into draft orders. CommerceFlow now needs an internal payment domain to track payment lifecycle independently from order lifecycle, without integrating external payment gateways or capturing real money.

Sprint 6.4 implements payment foundation: internal/manual payments with status transitions.

## Decision

### Payments as a separate aggregate

Payments are modeled as their own aggregate linked to orders via `orderId`, not embedded on the `Order` model.

**Rationale:**

1. Order lifecycle (draft → confirmed → fulfilled) and payment lifecycle (pending → authorized → paid) evolve independently.
2. Future sprints may support partial payments, multiple payment attempts, and refunds — a one-to-many `Order → Payment` relation supports this without schema changes.
3. Gateway integrations (Stripe, Paystack, etc.) will plug into the payment service layer without touching order confirmation or fulfillment logic.

### Payment model

| Field | Purpose |
|-------|---------|
| `storeId` | Tenant boundary |
| `orderId` | FK → Order (one-to-many) |
| `amount` / `currency` | Must match order subtotal for Sprint 6.4 |
| `status` | Internal lifecycle state |
| `provider` | `internal` or `manual` — no external gateway |
| `reference` | Unique internal reference for reconciliation |
| `metadata` | Optional JSON for notes/context |

### Payment lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Created, awaiting authorization |
| `authorized` | Funds approved (internal/manual) |
| `paid` | Payment settled |
| `failed` | Payment attempt failed |
| `cancelled` | Payment voided before settlement |

**Allowed transitions:**

| From | To |
|------|-----|
| `pending` | `authorized`, `failed`, `cancelled` |
| `authorized` | `paid`, `failed`, `cancelled` |
| `paid`, `failed`, `cancelled` | *(terminal)* |

Transitions use optimistic concurrency (`updateMany` with `fromStatus` guard) inside transactions.

### Amount validation

For Sprint 6.4, payment `amount` must equal the order `subtotal` and `currency` must match. Amount is derived from the order at creation time — not supplied by the client.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/orders/:id/payments` | `payments:write` |
| GET | `/api/orders/:id/payments` | `payments:read` |
| GET | `/api/payments/:id` | `payments:read` |
| POST | `/api/payments/:id/authorize` | `payments:lifecycle` |
| POST | `/api/payments/:id/mark-paid` | `payments:lifecycle` |
| POST | `/api/payments/:id/fail` | `payments:lifecycle` |
| POST | `/api/payments/:id/cancel` | `payments:lifecycle` |

### Domain events

- `payment.created`
- `payment.authorized`
- `payment.paid`
- `payment.failed`
- `payment.cancelled`

### Audit logging

Entity type `payment` with actions: `create`, `authorize`, `mark_paid`, `fail`, `cancel`.

### Payment intentionally separate from order

Checkout creates draft orders without payment. Order confirmation and fulfillment do not depend on payment status in this sprint. Future sprints may gate order confirmation on `paid` status via domain event handlers.

### Future gateway integrations

The `provider` field and `PaymentService` abstraction allow gateway-specific adapters (Stripe webhook handlers, Paystack callbacks) to be added without changing the core payment lifecycle. Gateway providers will update payment status via the same transition methods.

### Future partial payments and refunds

The one-to-many order-payment relation supports:

- Multiple payments per order (partial payments)
- Refund records as negative-amount payments or a separate `Refund` aggregate in a future sprint
- Payment reconciliation against order totals

## Consequences

### Positive

- Clear separation of commercial record (order) and settlement (payment)
- Internal/manual workflow for admin testing without gateway dependencies
- Lifecycle policy prevents invalid state transitions
- Ready for gateway adapter injection

### Negative / trade-offs

- No automatic order status update on payment completion (deferred)
- Full-order amount only — partial payments not yet supported
- No refund model yet
- `metadata` stored as JSON without schema validation beyond JSON shape

## References

- ADR 0008: Checkout Architecture
- ADR 0004: Domain Events Foundation
- ADR 0003: Audit Logging Foundation
- Sprint 4.0: Order Foundation
