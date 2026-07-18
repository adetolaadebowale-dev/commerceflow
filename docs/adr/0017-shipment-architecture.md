# ADR 0017: Shipment Architecture

## Status

Accepted — Sprint 7.2

## Context

Sprint 7.1 introduced tax foundation on top of financially aligned orders (Sprint 7.0). Phase 3 (Shipping & Fulfillment Operations) begins with a dedicated **Shipment** aggregate that tracks outbound delivery for fulfilled orders without coupling shipment lifecycle to order lifecycle.

Orders already capture an immutable shipping address snapshot at checkout. Fulfillment (Sprint 4.3) transitions orders to `fulfilled` after inventory deduction.

## Decision

Introduce a store-scoped **Shipment** aggregate with:

- One shipment per order (Sprint 7.2 constraint)
- Shipping address snapshotted from the order at creation (immutable thereafter)
- Lifecycle: `pending → packed → shipped → delivered`, with cancellation from `pending` or `packed`
- Shipment numbers generated as `SHP-{YYYYMMDD}-{suffix}` (same pattern as orders/invoices)
- RBAC permissions: `shipments:read`, `shipments:write`, `shipments:lifecycle`
- Domain events: `shipment.created`, `shipment.shipped`, `shipment.delivered`, `shipment.cancelled`
- Audit actions: `create`, `ship`, `deliver`, `cancel`

Carriers are limited to `internal` and `manual` for this sprint — no carrier integrations.

The `pack` transition is exposed via `POST /api/shipments/:id/pack` (service + route) but is not part of the typed API client surface in Sprint 7.2; clients call `shipShipment()` only after the shipment reaches `packed`.

## Consequences

- Shipment creation requires a **fulfilled** order with a complete shipping address snapshot.
- Shipment and order lifecycles remain independent after creation.
- Future sprints may add multi-parcel shipments, carrier APIs, and rate shopping without changing immutable address snapshots on existing records.
