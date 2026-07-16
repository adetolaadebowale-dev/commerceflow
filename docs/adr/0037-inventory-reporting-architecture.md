# ADR 0037: Inventory Reporting Architecture

## Status

Accepted — Sprint 9.2

## Context

Sprint 9.0 established the reporting foundation and Sprint 9.1 delivered sales reporting. CommerceFlow now needs comprehensive inventory reporting that surfaces on-hand quantities, reservations, allocations, incoming purchase orders, stock movement history, low-stock conditions, and valuation — all scoped by store and warehouse.

Inventory data is distributed across `InventoryItem`, `InventoryReservation`, `InventoryAllocation`, `StockMovement`, `PurchaseOrder`, `Shipment`, and `ReplenishmentRule` domains. Reports must remain read-only and reuse existing aggregates without introducing new write models.

## Decision

### Module

Introduce `apps/api/src/reports/inventory/` as the inventory reporting layer:

- `InventoryReportRepository` — loads read-only inventory and movement facts from existing repositories
- `InventoryReportsService` — filtering, aggregation, pagination, and report generation
- `inventory-aggregation` — metrics, breakdowns, low-stock detection, and valuation helpers
- Mappers — transform domain records into report DTOs

### Reports

| Report | Endpoint | Primary output |
|--------|----------|----------------|
| Inventory Summary | `GET /api/reports/inventory/summary` | Totals, by-warehouse, by-variant, low/out-of-stock, adjustment summary |
| Stock Movements | `GET /api/reports/inventory/stock-movements` | Paginated movement ledger with type totals |
| Low Stock | `GET /api/reports/inventory/low-stock` | Items at or below reorder point and out-of-stock items |
| Valuation | `GET /api/reports/inventory/valuation` | On-hand value using latest PO unit costs |

Embedded in summary: Inventory by Warehouse, Inventory by Product Variant, Low Stock, Out-of-Stock, Adjustment Report.

### Metrics

Computed from existing data:

- **Quantity On Hand** — `InventoryItem.quantityOnHand`
- **Reserved** — active `InventoryReservation` totals per item
- **Allocated** — active allocation hold via `sumActiveAllocationHold()`
- **Available** — on-hand minus reserved minus allocated hold
- **Incoming** — pending PO quantities (`quantityOrdered - quantityReceived`)
- **Outgoing** — picked allocation hold ready for shipment
- **Inventory Value** — on-hand × latest PO unit cost per warehouse/variant
- **Stock Movement Totals** — sum of immutable movement ledger entries
- **Adjustment Totals** — sum of `adjustment` type movements

### Shared contracts

Types in `packages/types/src/reports/inventory/`:

- `InventorySummary`, `InventoryWarehouseReport`, `InventoryMovementReport`, `LowStockReport`, `InventoryValuationReport`

Validation in `packages/validation/src/reports/inventory/` for summary, movements, low-stock, and valuation queries.

API client extensions on `ReportsClient`:

- `getInventorySummary()`, `getInventoryMovements()`, `getLowStockReport()`, `getInventoryValuation()`

### Authorization

- `reports:read` — staff and above (inherited from Sprint 9.0)

### Domain events

- `reports.inventory.generated` — emitted for summary, movements, low-stock, and valuation generation

### Audit

- Entity `inventory_report`
- Actions `generate_summary`, `generate_movements`, `generate_low_stock`, `generate_valuation`

## Consequences

- Inventory reporting composes existing repositories without duplicating business logic
- Valuation is best-effort based on latest purchase order unit costs when no dedicated cost layer exists
- Low-stock detection relies on enabled replenishment rules for reorder points
- Warehouse filtering applies consistently across all inventory report endpoints via shared `report-utils`
