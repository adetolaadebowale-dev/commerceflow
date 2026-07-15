# ADR 0028: Multi-Warehouse Architecture

## Status

Accepted — Sprint 8.3

## Context

Sprint 8.2 introduced inventory adjustments and cycle counts at store scope. CommerceFlow must now introduce explicit **Warehouse** locations and scope physical inventory to warehouses while preserving backward-compatible reservation flows that default to the store's default warehouse.

## Decision

### Data model

- `InventoryItem` uniqueness becomes `(storeId, warehouseId, productVariantId)` instead of `(storeId, productVariantId)`
- `warehouseId` is required on: `InventoryItem`, `StockMovement`, `InventoryAllocation`, `InventoryAdjustment`, `CycleCount`
- `warehouseId` is optional on `Shipment` (fulfillment may originate from a specific warehouse)
- Every stock movement records the warehouse where quantity changed

### Service behavior

- **Inventory create:** requires `warehouseId`; validates warehouse exists and is `active`
- **Inventory list / stock movement list:** optional `warehouseId` filter
- **Reservations:** `warehouseId` optional on reserve action; resolves to default warehouse when omitted
- **Cycle counts:** require `warehouseId`; all counted items must belong to that warehouse
- **Allocations / adjustments / fulfillment / returns:** derive `warehouseId` from the source inventory item

### API contracts

- `createInventoryItemSchema` — required `warehouseId`
- `listInventoryItemsQuerySchema`, `listStockMovementsQuerySchema` — optional `warehouseId`
- `createCycleCountSchema` — required `warehouseId`
- `orderReservationActionSchema` — optional `warehouseId`

## Consequences

- Same product variant may have separate on-hand quantities per warehouse
- Existing integrations must pass `warehouseId` when creating inventory or cycle counts
- Reservation flows without explicit `warehouseId` continue to work via the store default warehouse
- Stock movement audit trail is warehouse-aware for multi-location reporting
- Future sprints can add inter-warehouse transfers using `movementType: transfer`
