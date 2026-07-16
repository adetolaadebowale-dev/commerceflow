# ADR 0041: Executive Dashboard Architecture

## Status

Accepted — Sprint 9.6

## Context

Sprints 9.0–9.5 delivered the reporting foundation and domain-specific analytics modules for sales, inventory, customers, financial, and procurement data. Phase 4 (Reporting & Analytics) requires a unified executive dashboard that consolidates these read-only report surfaces without introducing new business aggregates or write operations.

CommerceFlow already exposes a placeholder dashboard at `GET /api/reports/dashboard` from Sprint 9.0. Sprint 9.6 adds executive-grade KPI consolidation while preserving the legacy foundation endpoint for backward compatibility.

## Decision

### Module

Introduce `apps/api/src/reports/dashboard/` as the executive dashboard layer:

- `DashboardReportRepository` — loads source summaries from existing domain report services in parallel
- `DashboardReportsService` — orchestration, KPI consolidation, pagination, and report generation
- `dashboard-aggregation` — executive summary and section builders
- Mappers — transform consolidated summaries into dashboard DTOs

The dashboard composes data exclusively from:

- `SalesReportsService.getSummary()`
- `FinancialReportsService.getSummary()`
- `InventoryReportsService.getSummary()`
- `CustomerReportsService.getSummary()`
- `ProcurementReportsService.getSummary()`

### Dashboard sections

| Section | Source module |
|---------|---------------|
| Executive Overview | Consolidated executive KPIs |
| Sales KPIs | Sales summary |
| Financial KPIs | Financial summary |
| Inventory KPIs | Inventory summary |
| Customer KPIs | Customer summary |
| Procurement KPIs | Procurement summary |
| Warehouse KPIs | Procurement warehouse performance |
| Fulfillment KPIs | Procurement fulfillment analytics |

### Executive KPIs

Consolidated into `ExecutiveSummary`:

- Gross Revenue, Net Revenue — financial summary
- Orders, Average Order Value — sales summary
- Customers — customer summary
- Inventory Value, Low Stock Count — inventory summary
- Purchase Order Value, Warehouse Throughput, Fulfillment Volume, Replenishment Acceptance Rate — procurement summary
- Return Rate — completed refund totals divided by gross revenue
- Collection Rate — financial summary

### API endpoints

| Endpoint | Output |
|----------|--------|
| `GET /api/reports/dashboard/executive` | Full executive dashboard with sections |
| `GET /api/reports/dashboard/kpis` | Paginated flat KPI list with executive summary |

Filters: date ranges, warehouse scope, currency (inherited from reporting foundation).

Legacy placeholder: `GET /api/reports/dashboard` remains unchanged from Sprint 9.0.

### Shared contracts

Types in `packages/types/src/reports/dashboard/`:

- `ExecutiveDashboard`, `DashboardKPI`, `DashboardSection`, `ExecutiveSummary`, `DashboardKPIReport`

Validation in `packages/validation/src/reports/dashboard/`.

API client extensions on `ReportsClient`:

- `getExecutiveDashboard()`, `getDashboardKPIs()`

### Authorization

- `reports:read` — staff and above (inherited from Sprint 9.0)

### Domain events

- `reports.dashboard.generated` — emitted for executive dashboard and KPI list generation

### Audit

- Entity `dashboard_report`
- Actions `generate_executive`, `generate_kpis`

## Consequences

- Executive KPIs remain consistent with underlying domain reports because they are derived from the same summary services
- Parallel summary loading keeps dashboard generation performant without new persistence layers
- The Sprint 9.0 placeholder dashboard remains available for foundation compatibility
- Phase 4 Reporting & Analytics is complete; future work can add visualization or export layers without changing core aggregates
