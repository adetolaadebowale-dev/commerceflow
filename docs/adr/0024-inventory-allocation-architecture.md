# ADR 0024: Warehouse Inventory Allocation Architecture

## Status

Accepted — Sprint 7.9

## Context

Sprint 7.8 introduced pick lists and line items with `quantityRequired` / `quantityPicked`, but picking did not reserve or track inventory at the bin level. Warehouse staff need to allocate stock to pick lines, record partial picks, and report shortages without mutating `quantityOnHand` (physical deductions remain tied to order fulfillment).

## Decision

Introduce an `InventoryAllocation` aggregate that links a `PickListItem` to an `InventoryItem` with allocated and picked quantities and a dedicated lifecycle status.

### Availability model

Allocatable quantity is computed as:

```
quantityOnHand − activeReservations − activeAllocationHolds
```

Active allocation holds apply to allocations in `allocated` or `partially_picked` status and equal `quantityAllocated − quantityPicked`.

### API surface

| Method | Path | Permission |
|---|---|---|
| POST | `/api/pick-list-items/:id/allocate` | `inventory:write` |
| PATCH | `/api/inventory-allocations/:id` | `inventory:write` |
| POST | `/api/inventory-allocations/:id/report-shortage` | `inventory:write` |
| GET | `/api/inventory-allocations/:id` | `inventory:read` |

### Mutability guards

- Delivered or cancelled shipments are immutable.
- Packed pick lists cannot receive new allocations or updates.
- `picked` and `shortage` allocations are terminal.

### Side effects

- Updating picked quantity aggregates to `PickListItem.quantityPicked`.
- Domain events: `inventory.allocated`, `inventory.partially-picked`, `inventory.picked`, `inventory.shortage-reported`.
- Audit entity `inventory_allocation` with actions `allocate`, `update`, `report_shortage`.

## Consequences

- Picking can proceed incrementally with explicit shortage handling.
- Allocation holds prevent double-committing the same on-hand stock during concurrent picks.
- Physical inventory remains unchanged until existing fulfillment flows deduct stock.
