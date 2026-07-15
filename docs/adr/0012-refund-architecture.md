# ADR 0012: Refund Architecture

## Status

Accepted

## Date

2026-07-15

## Context

CommerceFlow separates financial operations into distinct domains:

- **Orders** — commercial intent and fulfillment lifecycle
- **Payments** — settlement and provider interactions
- **Invoices** — financial documents for billing and reconciliation
- **Refunds** — reversal of settled payments

Sprint 6.7 introduces refunds as a store-scoped financial aggregate linked to payments, independent from order and invoice lifecycles. Payment gateway integration, real money transfers, and partial refunds are deferred.

## Decision

### Payment vs Refund

| Domain | Purpose | Lifecycle |
|--------|---------|-----------|
| Payment | Capture funds from customer | pending → authorized → paid/failed/cancelled |
| Refund | Return funds to customer | pending → completed/cancelled |

A refund always references exactly one payment. Refund amount and currency are derived from the payment at creation — not supplied by the client. Refund and payment lifecycles do not automatically sync; completing a refund does not mutate payment status in this sprint.

### Full-refund model (Sprint 6.7)

| Rule | Enforcement |
|------|-------------|
| One refund per payment | `@@unique([storeId, paymentId])` |
| Full amount only | Amount copied from `payment.amount` |
| Currency match | Currency copied from `payment.currency` |
| Paid payments only | Service rejects non-`paid` payments |
| Completed immutability | No transitions from `completed` |

### Refund model

| Field | Purpose |
|-------|---------|
| `storeId` | Tenant boundary |
| `paymentId` | FK → Payment (unique per store) |
| `amount` / `currency` | Snapshotted from payment at creation |
| `status` | Refund lifecycle |
| `reason` | Required business justification |
| `completedAt` | Set when status → `completed` |

### Refund lifecycle

| Status | Meaning |
|--------|---------|
| `pending` | Refund initiated, awaiting completion |
| `completed` | Refund processed — immutable |
| `cancelled` | Refund voided before completion |

**Allowed transitions:**

| From | To |
|------|-----|
| `pending` | `completed`, `cancelled` |
| `completed`, `cancelled` | *(terminal)* |

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/payments/:id/refunds` | `refunds:write` |
| GET | `/api/payments/:id/refunds` | `refunds:read` |
| GET | `/api/refunds/:id` | `refunds:read` |
| POST | `/api/refunds/:id/complete` | `refunds:lifecycle` |
| POST | `/api/refunds/:id/cancel` | `refunds:lifecycle` |

### Domain events

- `refund.created`
- `refund.completed`
- `refund.cancelled`

### Audit logging

Entity type `refund` with actions: `create`, `complete`, `cancel`.

### Future partial refunds

Sprint 6.7 enforces one full refund per payment. Future sprints will:

- Remove or relax the unique constraint to allow multiple refunds per payment
- Accept partial amounts with cumulative refund cap validation
- Introduce `RefundLine` items linked to order line items for granular reconciliation

### Gateway integration strategy

Refund completion will invoke the payment gateway abstraction (ADR 0010) via a `refundPayment` operation on `PaymentGateway`. Sprint 6.7 records refund intent only — no gateway calls. The internal gateway will simulate success; external gateways (Stripe, PayPal) will implement provider-specific refund APIs in a future sprint.

Flow (future):

1. Create refund record (`pending`)
2. Call gateway refund on complete
3. On gateway success → mark `completed`; on failure → remain `pending` or transition to a failure state

### Accounting implications

Refunds represent negative cash flow against original payment settlement:

- **Completed refunds** reduce net revenue and should emit accounting export events (credit memo / refund receipt)
- Refund amount ties to original payment for reconciliation
- Partial refunds (future) will require line-level allocation for tax and revenue recognition
- Refund events feed future accounting adapters via domain event handlers, keeping the core refund service provider-agnostic

## Consequences

### Positive

- Clear separation of refund intent from payment capture
- Immutable completed refunds for audit trail integrity
- One-refund-per-payment constraint prevents duplicate full refunds
- Gateway-agnostic design ready for provider integration

### Negative / trade-offs

- Refund completion does not update payment status in this sprint
- No partial refunds — full amount only
- No gateway or real money movement
- Manual lifecycle (complete/cancel) — no auto-refund on order cancellation

## References

- ADR 0010: Payment Gateway Abstraction
- ADR 0009: Payment Foundation
- ADR 0011: Invoice Architecture
- Sprint 6.4: Payment Foundation
