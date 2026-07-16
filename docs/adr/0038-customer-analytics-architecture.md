# ADR 0038: Customer Analytics Architecture

## Status

Accepted — Sprint 9.3

## Context

Sprint 9.0 established the reporting foundation, Sprint 9.1 delivered sales reporting, and Sprint 9.2 delivered inventory reporting. CommerceFlow now needs customer analytics that surface lifetime value, growth, purchase frequency, geographic distribution, and order history — all scoped by store and derived from immutable customer, order, payment, and refund snapshots.

Customer analytics data spans `Customer`, `CustomerAddress`, `Order`, `Payment`, and `Refund` domains. Reports must remain read-only and must not introduce new customer business logic or write models.

## Decision

### Module

Introduce `apps/api/src/reports/customers/` as the customer analytics layer:

- `CustomerReportRepository` — loads read-only customer profile and order facts from existing repositories
- `CustomerReportsService` — filtering, aggregation, pagination, and report generation
- `customer-aggregation` — CLV, growth, new vs returning, purchase frequency, and geographic helpers
- Mappers — transform domain records into report DTOs

### Reports

| Report | Endpoint | Primary output |
|--------|----------|----------------|
| Customer Summary | `GET /api/reports/customers/summary` | Metrics, new vs returning, purchase frequency, geographic distribution |
| Customer Growth | `GET /api/reports/customers/growth` | Time-bucketed customer counts |
| Top Customers | `GET /api/reports/customers/top` | Paginated customers ranked by lifetime value |
| Customer Order History | `GET /api/reports/customers/orders` | Paginated order ledger per customer |

Embedded in summary: CLV aggregate, new vs returning, purchase frequency, geographic distribution.

### Metrics

Computed from immutable order/payment/refund snapshots:

- **Total Customers** — count of store customer profiles matching filters
- **Active Customers** — customers with revenue orders in the reporting period
- **New Customers** — first revenue order falls within the reporting period
- **Returning Customers** — prior revenue orders exist before the period
- **Lifetime Value** — sum of net order totals minus completed refunds
- **Average Order Value** — net revenue divided by revenue order count
- **Orders per Customer** — revenue orders divided by unique purchasing customers
- **Revenue per Customer** — net revenue divided by unique purchasing customers
- **Average Purchase Interval** — mean days between consecutive revenue orders

Revenue orders use the same `confirmed | fulfilled` rule as sales reporting. Report timestamps use `confirmedAt ?? createdAt`.

### Shared contracts

Types in `packages/types/src/reports/customers/`:

- `CustomerSummary`, `CustomerGrowthPoint`, `CustomerLifetimeValue`, `CustomerOrderReport`, `TopCustomerReport`

Validation in `packages/validation/src/reports/customers/` for summary, growth, top customers, and customer orders queries.

API client extensions on `ReportsClient`:

- `getCustomerSummary()`, `getCustomerGrowth()`, `getTopCustomers()`, `listCustomerOrders()`

### Authorization

- `reports:read` — staff and above (inherited from Sprint 9.0)

### Domain events

- `reports.customers.generated` — emitted for summary, growth, top customers, and order history generation

### Audit

- Entity `customer_report`
- Actions `generate_summary`, `generate_growth`, `generate_top_customers`, `generate_customer_orders`

## Consequences

- Customer analytics composes existing repositories without duplicating CRM business logic
- Orders link to customer profiles via `customerProfileId`; analytics exclude anonymous orders from per-customer metrics
- CLV subtracts completed refunds linked to order payments for net lifetime value
- Geographic distribution uses default customer addresses when available
- New vs returning classification requires full order history while period metrics respect date filters
