# ADR 0016: Tax Foundation

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 7.0 aligned payment, invoice, and refund amounts around `Order.total`. Sprint 7.1 introduces store-configured sales tax without external providers, multi-jurisdiction support, or shipping tax.

## Decision

### Why tax is separate from promotions

| Concern | Promotion | Tax |
|---------|-----------|-----|
| Purpose | Merchant discount | Government/regulatory levy |
| Application | Optional code redemption | Store-configured rate |
| Direction | Reduces price | Increases payable amount |
| Aggregate | Promotion (Sprint 6.8) | TaxRate (Sprint 7.1) |

Promotions and tax are calculated sequentially, not interchangeably.

### Taxable amount

```
subtotal        = sum of line item subtotals
discountAmount  = promotion discount (optional)
taxableAmount   = subtotal - discountAmount
taxAmount       = taxableAmount × rate / 100
total           = taxableAmount + taxAmount
```

Tax is calculated **after** discounts. Checkout recalculates from line items and stored promotion snapshots — never from persisted cart totals.

### Snapshot strategy

At checkout, the active store tax rate is snapshotted onto the order via `OrderAppliedTaxRate`:

- `taxRateId`, `nameSnapshot`, `percentageSnapshot`, `taxAmount`

Invoices copy the order tax snapshot at creation. Orders and invoices remain historically correct if the live tax rate changes later.

### Payment alignment

`Payment.amount` continues to snapshot `Order.total` (post-discount, post-tax payable amount).

### One active rate per store

Enforced via partial unique index and activation logic that deactivates the previous active rate. Future multi-jurisdiction support may introduce region-scoped rates without changing the snapshot model.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/tax-rates` | `tax-rates:write` |
| GET | `/api/tax-rates` | `tax-rates:read` |
| GET | `/api/tax-rates/:id` | `tax-rates:read` |
| PATCH | `/api/tax-rates/:id` | `tax-rates:write` |
| DELETE | `/api/tax-rates/:id` | `tax-rates:write` |
| POST | `/api/tax-rates/:id/activate` | `tax-rates:write` |
| POST | `/api/tax-rates/:id/deactivate` | `tax-rates:write` |

### Domain events

| Event | When |
|-------|------|
| `tax.created` | After tax rate creation |
| `tax.updated` | After field update |
| `tax.activated` | After activation |
| `tax.deactivated` | After deactivation |

### Audit logging

Entity type `tax_rate`; actions `create`, `update`, `activate`, `deactivate`.

### Future multi-jurisdiction support

Sprint 7.1 intentionally supports one active rate per store. A future engine may add jurisdiction keys, product tax categories, and address-based rate selection while preserving immutable order/invoice snapshots.

## Consequences

### Positive

- Consistent tax calculation in checkout
- Historical correctness via snapshots
- Clear separation from promotions
- Payment/invoice/refund chain remains aligned through `Order.total`

### Negative

- Existing orders/invoices have no tax snapshots (pre-migration data)

## References

- ADR-0015: Financial Totals Model
- ADR-0014: Promotion Redemption Architecture
