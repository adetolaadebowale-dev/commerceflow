# ADR 0035: Reporting Foundation

## Status

Accepted — Sprint 9.0

## Context

Phase 3 operational readiness (ADR 0034) closed warehouse, fulfillment, and procurement orchestration. Phase 4 introduces Reporting & Analytics. Before domain-specific reports (sales, inventory, finance, customers, procurement), CommerceFlow needs reusable reporting infrastructure: filtering, pagination, grouping, aggregation, store and warehouse scoping, timezone-aware date ranges, and currency-safe totals.

## Decision

### Module

Introduce `apps/api/src/reports/` as the reporting foundation layer:

- `ReportFoundationRepository` — loads store reporting defaults (timezone, currency, active warehouses)
- `ReportsService` — health and placeholder dashboard endpoints
- `report-utils` — shared filtering, pagination, grouping, aggregation, timezone, and currency helpers

No business-specific report aggregates or write models are introduced in Sprint 9.0.

### Shared contracts

Types in `packages/types/src/reports/`:

- `ReportDateRange`, `ReportFilter`, `ReportPagination`, `ReportSummary`, `DashboardMetric`

Validation in `packages/validation/src/reports/` for date range, pagination, sorting, grouping, and warehouse filters.

### API endpoints

- `GET /api/reports/health` — foundation metadata (`reports:read`)
- `GET /api/reports/dashboard` — placeholder dashboard metrics (`reports:read`)

### Authorization

- `reports:read` — staff and above

### Domain events

- `reports.generated`
- `dashboard.viewed`

### Audit

- Entity `report`
- Actions `generate`, `view_dashboard`

## Consequences

- Subsequent Phase 4 sprints can implement domain reports on a consistent foundation
- Dashboard and report endpoints share validation, pagination, and aggregation utilities
- Placeholder dashboard proves end-to-end wiring without premature business logic
- Future reports inherit timezone and currency-safe total handling from `report-utils`
- **Updated Sprint 9.6:** Executive dashboard endpoints (`/dashboard/executive`, `/dashboard/kpis`) now provide consolidated KPIs; the original `/dashboard` placeholder remains for foundation compatibility. See [Phase 4 Reporting & Analytics](../architecture/phase4-reporting-analytics.md) and [ADR 0041](0041-executive-dashboard-architecture.md).
