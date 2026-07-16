# ADR 0036: Sales Reporting Architecture

## Status

Accepted — Sprint 9.1

## Context

Sprint 9.0 established the reporting foundation (ADR 0035): shared filtering, pagination, grouping, aggregation, store and warehouse scoping, timezone-aware date ranges, and currency-safe totals. Phase 4 now requires the first business reporting module — comprehensive sales reporting built entirely on immutable order snapshots.

Sales data spans orders, payments, and shipments. Financial totals must reflect snapshotted order fields (`subtotal`, `discountAmount`, `taxAmount`, `shippingAmount`, `total`) rather than live catalogue or inventory state. Reports must remain read-only and tenant-scoped.

## Decision

### Module

Introduce `apps/api/src/reports/sales/` as the sales reporting layer:

- `SalesReportRepository` — loads read-only sales facts from orders, payments, and shipments
- `SalesReportsService` — aggregation, filtering, and report generation
- `sales-aggregation` — financial metrics, period grouping, and dimensional breakdowns
- Mappers — transform domain snapshots into report DTOs
- Routes — thin HTTP handlers for three read endpoints

No write models or mutation paths are introduced.

### Reports

`SalesSummary` delivers:

- Financial metrics: gross sales, discounts, taxes, shipping, net sales, AOV, order count, units sold
- Dimensional breakdowns: by day, week, month, order status, payment status, store, warehouse

`SalesTimelineReport` delivers configurable day/week/month timeline points.

`SalesOrdersReport` delivers paginated per-order rows with snapshot financials.

Revenue metrics include `confirmed` and `fulfilled` orders only. Draft and cancelled orders appear in status breakdowns but are excluded from revenue totals.

### Data sources

- **Orders** — primary financial snapshots and line-item quantities
- **Payments** — derived payment status per order (highest-priority status wins)
- **Shipments** — optional `warehouseId` for warehouse-scoped filtering and breakdowns

Report timestamps use `confirmedAt ?? createdAt` for period grouping.

### Shared contracts

Types in `packages/types/src/reports/sales/`:

- `SalesSummary`, `SalesTimelinePoint`, `SalesOrderReport`

Validation in `packages/validation/src/reports/sales/` for summary, timeline, and orders query schemas.

API client extensions on `ReportsClient`:

- `getSalesSummary()`, `getSalesTimeline()`, `listSalesOrders()`

### API endpoints

- `GET /api/reports/sales/summary` — comprehensive summary (`reports:read`)
- `GET /api/reports/sales/timeline` — period timeline (`reports:read`)
- `GET /api/reports/sales/orders` — paginated order rows (`reports:read`)

All endpoints support date range, warehouse filter, order status filter, and currency filter. The orders endpoint additionally supports pagination and sorting.

### Authorization

- `reports:read` — staff and above (inherited from Sprint 9.0)

### Domain events

- `reports.sales.generated` — emitted for summary, timeline, and orders report generation

### Audit

- Entity `sales_report`
- Actions `generate_summary`, `generate_timeline`, `generate_orders`

## Consequences

- Sales reporting reuses foundation utilities (`buildReportFilter`, `paginateItems`, `sumCurrencyAmounts`, warehouse scoping) without duplicating infrastructure
- Immutable order snapshots guarantee report consistency even when catalogue prices change
- Warehouse breakdowns are best-effort when shipment data exists; orders without shipments remain visible in store-level totals
- Subsequent Phase 4 sprints (inventory, finance, customers) can follow the same repository-service-route pattern established here
