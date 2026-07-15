# ADR 0015: Financial Totals Model

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.9 introduced promotion discounts on orders with `subtotal`, `discountAmount`, and `total`. Payment and invoice services still referenced `order.subtotal` as the payable amount, creating a misalignment when promotions were applied.

Sprint 7.0 aligns all financial entities around a single, consistent monetary model without introducing taxes, shipping, or loyalty.

## Decision

### Standard order monetary fields

| Field | Definition |
|-------|------------|
| `subtotal` | Merchandise value — sum of line item subtotals (pre-discount) |
| `discountAmount` | Applied promotion discount (optional; absent when no promotion) |
| `total` | Payable amount = `subtotal - discountAmount` |

All downstream services treat `total` as the amount the customer owes.

### Why payments use total

Payment represents money collected from the customer. The customer pays the discounted amount, not the pre-discount merchandise subtotal. `Payment.amount` snapshots `Order.total` at creation time.

Gateway initialization uses the same payable amount so external providers receive the correct charge value.

### Invoice snapshot strategy

Invoices snapshot the full financial breakdown from the order at creation:

| Field | Source |
|-------|--------|
| `subtotal` | `Order.subtotal` (merchandise) |
| `discountAmount` | `Order.discountAmount` |
| `total` | `Order.total` (payable) |

Invoice lifecycle (draft → issued → paid → void) is unchanged. Financial fields are immutable after creation, preserving historical correctness even if the live promotion definition changes later.

### Refund source of truth

Refund amount derives from `Payment.amount`, not directly from the order. This preserves the payment-refund chain:

```
Order.total → Payment.amount → Refund.amount
```

No refund API changes were required; fixing payment creation automatically aligns refunds.

### Checkout recalculation

Checkout never trusts persisted cart totals. It always:

1. Recalculates `subtotal` from line item snapshots
2. Recalculates `discountAmount` from stored promotion snapshots
3. Computes `total = subtotal - discountAmount`

Cart-level `subtotal`, `discountAmount`, and `total` are display/enrichment values only.

### Domain events and audit

Order, invoice, and checkout domain events include `total` and `discountAmount` where financially meaningful. Audit metadata for checkout and invoice creation records the full breakdown.

### Future taxes and shipping

This model intentionally excludes taxes and shipping. When added in a future sprint:

- `subtotal` remains merchandise-only
- New fields (e.g. `taxAmount`, `shippingAmount`) extend the breakdown
- `total` becomes `subtotal - discountAmount + taxAmount + shippingAmount`

The snapshot philosophy established here applies unchanged — each financial entity captures its breakdown at creation time.

## Consequences

### Positive

- Consistent payable amount across order, payment, invoice, and refund
- Historical correctness preserved via immutable snapshots
- No breaking API changes — new invoice fields are additive

### Negative

- Existing invoices created before migration have `total = subtotal` with no `discountAmount` (backfilled)

## References

- ADR-0014: Promotion Redemption Architecture
- ADR-0011: Invoice Architecture
- ADR-0009: Payment Foundation
