# ADR 0040: Procurement & Warehouse Analytics Architecture

## Status

Accepted — Sprint 9.5

## Context

Sprint 9.0 established the reporting foundation, Sprint 9.1 delivered sales reporting, Sprint 9.2 delivered inventory reporting, Sprint 9.3 delivered customer analytics, and Sprint 9.4 delivered financial reporting. CommerceFlow now needs procurement and warehouse analytics that compose purchase orders, suppliers, warehouses, transfers, replenishment recommendations, stock movements, and shipments from immutable operational snapshots.

Procurement data spans `PurchaseOrder`, `Supplier`, `Warehouse`, `WarehouseTransfer`, `ReplenishmentRecommendation`, `StockMovement`, `InventoryItem`, and `Shipment` domains. Reports must remain read-only and must not introduce new business aggregates or write operations.

## Decision

### Module

Introduce `apps/api/src/reports/procurement/` as the procurement and warehouse analytics layer:

- `ProcurementReportRepository` — loads read-only facts from existing repositories
- `ProcurementReportsService` — filtering, aggregation, pagination, and report generation
- `procurement-aggregation` — purchase order, supplier, warehouse, transfer, replenishment, receiving, and fulfillment helpers
- Mappers — transform domain records into report DTOs

### Reports

| Report | Endpoint | Primary output |
|--------|----------|----------------|
| Procurement Summary | `GET /api/reports/procurement/summary` | Core metrics plus embedded PO, supplier, warehouse, transfer, replenishment, receiving, and fulfillment analytics |
| Purchase Order Analytics | `GET /api/reports/procurement/purchase-orders` | Paginated purchase order ledger with summary totals |
| Supplier Performance | `GET /api/reports/procurement/suppliers` | Paginated supplier performance rows with summary totals |
| Warehouse Performance | `GET /api/reports/procurement/warehouses` | Paginated warehouse performance rows with summary totals |
| Replenishment Analytics | `GET /api/reports/procurement/replenishment` | Paginated replenishment recommendation ledger with summary totals |

Embedded in summary: Purchase Order Analytics, Supplier Performance, Warehouse Performance, Transfer Analytics, Replenishment Analytics, Receiving Analytics, Fulfillment Analytics.

### Metrics

Computed from immutable operational snapshots:

- **Purchase Order Count / Value** — count and sum of line totals (`quantityOrdered × unitCost`)
- **Receiving Rate** — received quantity divided by ordered quantity for active POs
- **Partial Receiving Rate** — partially received PO count divided by active PO count
- **Supplier Purchase Volume** — sum of PO value grouped by supplier
- **Supplier On-Time Receiving** — share of received POs where `receivedAt <= expectedDeliveryDate` when both timestamps exist
- **Warehouse Throughput** — sum of absolute stock movement quantities per warehouse
- **Warehouse Inventory Turnover** — outbound movement quantity divided by average on-hand quantity
- **Transfer Volume** — sum of transfer line quantities
- **Replenishment Recommendation Count** — count of recommendations in scope
- **Recommendation Acceptance Rate** — accepted recommendations divided by resolved recommendations (`accepted + dismissed`)
- **Fulfillment Volume** — count of shipped or delivered shipments

Report timestamps: purchase orders use `receivedAt ?? orderedAt ?? createdAt`; transfers use `receivedAt ?? shippedAt ?? approvedAt ?? createdAt`; replenishment uses `createdAt`; shipments use `fulfilledAt ?? deliveredAt ?? shippedAt ?? createdAt`; stock movements use `createdAt`.

### Shared contracts

Types in `packages/types/src/reports/procurement/`:

- `ProcurementSummary`, `PurchaseOrderAnalytics`, `SupplierAnalytics`, `WarehouseAnalytics`, `ReplenishmentAnalytics`

Validation in `packages/validation/src/reports/procurement/` for summary, purchase orders, suppliers, warehouses, and replenishment queries.

API client extensions on `ReportsClient`:

- `getProcurementSummary()`, `getPurchaseOrderAnalytics()`, `getSupplierAnalytics()`, `getWarehouseAnalytics()`, `getReplenishmentAnalytics()`

### Authorization

- `reports:read` — staff and above (inherited from Sprint 9.0)

### Domain events

- `reports.procurement.generated` — emitted for summary, purchase orders, suppliers, warehouses, and replenishment generation

### Audit

- Entity `procurement_report`
- Actions `generate_summary`, `generate_purchase_orders`, `generate_suppliers`, `generate_warehouses`, `generate_replenishment`

## Consequences

- Procurement analytics composes existing repositories without duplicating purchase order or replenishment business logic
- Bulk reads paginate domain lists and join related facts in memory (same pattern as financial and customer reporting)
- Warehouse filtering applies to POs, movements, shipments, transfers, and inventory snapshots via shared `report-utils`
- Supplier filtering applies to purchase orders and replenishment recommendations
- On-time receiving depends on `expectedDeliveryDate` and `receivedAt` being present on purchase order snapshots
- Inventory turnover is a simplified operational ratio from movement and inventory snapshots, not a financial COGS calculation
