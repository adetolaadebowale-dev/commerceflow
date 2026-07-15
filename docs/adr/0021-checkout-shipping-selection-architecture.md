# ADR 0021: Checkout Shipping Selection Architecture

## Status

Accepted — Sprint 7.6

## Context

Sprint 7.5 introduced merchant-configurable shipping zones and methods. Sprint 7.6 wires checkout to resolve eligible methods from the customer's shipping address, calculate flat-rate shipping, and snapshot configuration onto orders and invoices.

## Decision

Extend checkout with mandatory `shippingMethodId` input. `CheckoutShippingResolver` validates:

- Method exists and is active
- Zone exists, is active, and covers destination country code
- Method currency matches order currency

Financial totals follow:

```
taxableAmount = subtotal - discountAmount
total = taxableAmount + taxAmount + shippingAmount
```

Persist immutable snapshot via `OrderAppliedShippingMethod` and inline fields on `Invoice`. Emit `checkout.shipping.selected` before `checkout.completed`.

## Consequences

- All checkout calls require a resolved shipping method; no zero-shipping checkout path.
- Orders and invoices remain historically correct when live shipping configuration changes.
- Payment and refund amounts automatically include shipping via existing order total propagation.
