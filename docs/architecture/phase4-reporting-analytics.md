# Phase 4 — Reporting & Analytics

CommerceFlow Phase 4 delivers read-only reporting and analytics across sales, inventory, customers, financial, procurement, and executive dashboard surfaces. All modules compose immutable operational snapshots without introducing new business aggregates.

## Module map

| Sprint | Module | Primary endpoints |
|--------|--------|-------------------|
| 9.0 | Reporting foundation | `GET /api/reports/health`, `GET /api/reports/dashboard` |
| 9.1 | Sales reporting | `GET /api/reports/sales/summary`, `/timeline`, `/orders` |
| 9.2 | Inventory reporting | `GET /api/reports/inventory/summary`, `/stock-movements`, `/low-stock`, `/valuation` |
| 9.3 | Customer analytics | `GET /api/reports/customers/summary`, `/growth`, `/top`, `/orders` |
| 9.4 | Financial reporting | `GET /api/reports/financial/summary`, `/revenue`, `/payments`, `/invoices`, `/refunds` |
| 9.5 | Procurement & warehouse analytics | `GET /api/reports/procurement/summary`, `/purchase-orders`, `/suppliers`, `/warehouses`, `/replenishment` |
| 9.6 | Executive dashboard | `GET /api/reports/dashboard/executive`, `/kpis` |

## Shared infrastructure

All report modules inherit from the Sprint 9.0 foundation:

- Store and warehouse scoping via `ReportFilter`
- Timezone-aware date ranges
- Currency-safe totals
- Pagination and sorting for tabular reports
- `reports:read` authorization
- Domain events per module (`reports.sales.generated`, `reports.inventory.generated`, etc.)
- Audit entities per report domain

Executive dashboard (Sprint 9.6) consolidates summary outputs from Sprints 9.1–9.5 into unified KPI sections without duplicating aggregation logic.

## Architecture decision records

- [ADR 0035: Reporting Foundation](../adr/0035-reporting-foundation.md)
- [ADR 0036: Sales Reporting Architecture](../adr/0036-sales-reporting-architecture.md)
- [ADR 0037: Inventory Reporting Architecture](../adr/0037-inventory-reporting-architecture.md)
- [ADR 0038: Customer Analytics Architecture](../adr/0038-customer-analytics-architecture.md)
- [ADR 0039: Financial Reporting Architecture](../adr/0039-financial-reporting-architecture.md)
- [ADR 0040: Procurement & Warehouse Analytics Architecture](../adr/0040-procurement-warehouse-analytics-architecture.md)
- [ADR 0041: Executive Dashboard Architecture](../adr/0041-executive-dashboard-architecture.md)

## Design principles

1. **Read-only** — no report module writes operational data or creates business aggregates
2. **Immutable snapshots** — metrics derive from existing domain records at query time
3. **Composable** — executive dashboard reuses domain summary services rather than reimplementing aggregation
4. **Tenant isolated** — all queries are store-scoped with optional warehouse filters
5. **Consistent contracts** — shared types and validation schemas in `packages/types` and `packages/validation`

## API client

`ReportsClient` in `@commerceflow/api-client` exposes typed methods for all report endpoints including `getExecutiveDashboard()` and `getDashboardKPIs()`.
