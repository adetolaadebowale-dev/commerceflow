# ADR 0033: Operational Integration & Warehouse Stabilization

## Status

Accepted — Sprint 8.8

## Context

CommerceFlow has mature domains for orders, inventory, fulfillment, procurement, shipping, returns, and warehouse operations. Sprint 8.7 connected replenishment to purchase orders. The platform now needs a cross-domain orchestration layer that validates operational consistency and exposes read-only operational dashboards without introducing new core aggregates or duplicating domain business logic.

## Decision

### Module

Introduce `apps/api/src/operations/` as an orchestration and validation layer coordinating existing domains:

- `OperationalIntegrityService` — orchestrates cross-domain integrity checks and read models
- `WarehouseConsistencyService` — shipment/pick alignment and transfer vs fulfillment conflicts
- `InventoryIntegrityService` — allocation release, adjustment consistency, replenishment staleness after receiving/returns/cycle counts
- `OperationsReadService` — builds optimized read-only summaries from snapshot context

### Snapshot loading

`OperationsContextProvider` loads a read-only store snapshot from existing repositories (list endpoints and new `listByStoreId` helpers for shipment, pick list, allocation, reservation, and return repositories). No new write models or aggregates.

### Validation rules

- Shipment cannot progress with inconsistent pick state (packed/shipped/delivered requires packed pick list)
- Warehouse transfers in `approved` or `in_transit` cannot conflict with active fulfillment allocations on the same source warehouse inventory
- Pending replenishment recommendations must reflect inventory after PO receiving
- Completed returns must be reflected in replenishment calculations
- Inventory adjustments must reference consistent warehouse/inventory item pairs
- Approved cycle counts must be reflected in pending replenishment recommendations
- Allocation holds must be fully released (`fulfilled`) after shipment fulfillment

### Read models (read-only APIs)

- `GET /api/operations/warehouse-summary`
- `GET /api/operations/fulfillment-dashboard`
- `GET /api/operations/procurement-dashboard`
- `GET /api/operations/inventory-health`

### Validation runs

- `POST /api/operations/integrity-check`
- `POST /api/operations/warehouse-validation`
- `POST /api/operations/inventory-validation`

### Authorization

- `operations:read` — dashboard and summary endpoints
- `operations:run` — integrity validation runs
- Staff: read only; manager and above: read + run

### Domain events

- `operations.integrity.checked`
- `warehouse.integrity.checked`
- `inventory.integrity.checked`

### Audit

- Entity `operations`
- Actions `integrity_check`, `warehouse_validation`, `inventory_validation`

## Consequences

- Operational inconsistencies are detectable without modifying domain services
- Warehouse, fulfillment, and procurement teams gain unified read-only dashboards
- Integrity checks compose existing repository data; domain services remain the source of business rules for writes
- Future sprints can add scheduled integrity jobs or alerting on top of this layer
