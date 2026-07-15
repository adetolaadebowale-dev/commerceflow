# ADR 0027: Inventory Adjustments & Cycle Count Architecture

## Status

Accepted — Sprint 8.2

## Context

Sprint 8.0 introduced immutable stock movements and shipment fulfillment. Sprint 8.1 added warehouse returns. CommerceFlow now needs first-class **InventoryAdjustment** records and **CycleCount** sessions to reconcile physical inventory with system quantities while preserving an append-only stock ledger.

## Decision

Introduce two store-scoped aggregates:

### InventoryAdjustment

- Immutable record of a manual quantity correction
- Every adjustment atomically updates `quantityOnHand` and creates a `StockMovement` with `movementType: adjustment`
- Number format: `ADJ-YYYYMMDD-XXXXXXXX`
- Negative adjustments rejected when they would drop below zero

### CycleCount

- Lifecycle: `draft → counting → completed → approved`
- **Create (draft):** snapshots `expectedQuantity` from current on-hand per item
- **Start:** `draft → counting`, sets `startedAt`
- **Complete:** accepts counted quantities, auto-calculates `variance = countedQuantity - expectedQuantity`
- **Approve:** for non-zero variance items, creates linked `InventoryAdjustment` + stock movements
- **Immutable:** `completed` and `approved` are terminal; no further mutations

### Cross-cutting

- Reuse existing RBAC: `inventory:read`, `inventory:write`
- Domain events: `inventory.adjusted`, `cycle-count.*`, `stock-movement.created`
- Audit entities: `inventory_adjustment`, `cycle_count`
- Prisma transactions with rollback on failure

## Consequences

- Legacy `POST /api/stock-movements` adjust path remains for backward compatibility
- Cycle count approval may create zero adjustments when counts match expected quantities
- Store isolation enforced at repository and service layers
