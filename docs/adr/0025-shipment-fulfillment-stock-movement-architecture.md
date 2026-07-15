# ADR 0025: Shipment Fulfillment & Stock Movement Architecture

## Status

Accepted — Sprint 8.0

## Context

Sprint 7.9 introduced inventory allocations as temporary warehouse holds during picking. Physical inventory still needed an immutable ledger tied to shipment fulfillment, with atomic on-hand deductions and allocation release.

## Decision

Evolve `StockMovement` into the canonical immutable record of physical inventory changes and add shipment-scoped warehouse fulfillment.

### Stock movement model

Each movement records `movementType`, signed `quantity`, `previousQuantityOnHand`, `newQuantityOnHand`, and optional links to `shipmentId` and `inventoryAllocationId`.

### Shipment fulfillment flow

`POST /api/shipments/:id/fulfill` requires:

1. Shipment not previously fulfilled (`fulfilledAt` unset)
2. Packed pick list on the shipment
3. All allocations in `picked` status with quantities matching requirements

Within a single transaction:

- Deduct `quantityPicked` from `quantityOnHand`
- Create immutable `StockMovement` rows (`movementType: fulfillment`)
- Mark allocations `fulfilled` (releases holds)
- Set `shipment.fulfilledAt`

### Domain events

- `inventory.fulfilled` — shipment warehouse fulfillment completed
- `stock-movement.created` — emitted per movement row

## Consequences

- Order fulfillment (Sprint 4.3) and shipment fulfillment share the same ledger schema.
- Adjustment API continues to use `quantityChange` input mapped to `movementType: adjustment`.
- Physical inventory changes are always auditable through immutable movements.
