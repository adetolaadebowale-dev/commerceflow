# ADR 0039: Financial Reporting Architecture

## Status

Accepted — Sprint 9.4

## Context

Sprint 9.0 established the reporting foundation, Sprint 9.1 delivered sales reporting, Sprint 9.2 delivered inventory reporting, and Sprint 9.3 delivered customer analytics. CommerceFlow now needs comprehensive financial reporting that reconciles revenue, payments, invoices, refunds, taxes, discounts, and shipping from immutable financial snapshots.

Financial data spans `Order`, `Payment`, `Invoice`, and `Refund` domains. Reports must remain read-only and must not introduce new business aggregates or write operations.

## Decision

### Module

Introduce `apps/api/src/reports/financial/` as the financial reporting layer:

- `FinancialReportRepository` — loads read-only order, invoice, payment, and refund facts from existing repositories
- `FinancialReportsService` — filtering, aggregation, pagination, and report generation
- `financial-aggregation` — revenue, payment, invoice, refund, tax, discount, and shipping helpers
- Mappers — transform domain records into report DTOs

### Reports

| Report | Endpoint | Primary output |
|--------|----------|----------------|
| Financial Summary | `GET /api/reports/financial/summary` | Core metrics plus payment, invoice, refund, tax, discount, and shipping summaries |
| Revenue Timeline | `GET /api/reports/financial/revenue` | Time-bucketed revenue metrics |
| Payment Report | `GET /api/reports/financial/payments` | Paginated payment ledger with summary totals |
| Invoice Report | `GET /api/reports/financial/invoices` | Paginated invoice ledger with summary totals |
| Refund Report | `GET /api/reports/financial/refunds` | Paginated refund ledger with summary totals |

Embedded in summary: Payment Summary, Invoice Summary, Refund Summary, Tax Summary, Discount Summary, Shipping Revenue Summary.

### Metrics

Computed from immutable financial snapshots:

- **Gross Revenue** — sum of order subtotals for revenue orders (`confirmed | fulfilled`)
- **Net Revenue** — gross order totals minus completed refunds
- **Discounts, Taxes, Shipping Revenue** — sums from order financial snapshots
- **Refund Totals** — sum of completed refund amounts
- **Invoice Totals** — sum of non-void invoice totals
- **Payment Totals** — sum of non-cancelled payment amounts
- **Outstanding Invoices** — sum of issued (unpaid) invoice totals
- **Collection Rate** — paid invoice amount divided by collectible invoice amount
- **Average Payment Amount** — paid payment total divided by paid payment count

Report timestamps: orders use `confirmedAt ?? createdAt`; invoices use `issuedAt ?? paidAt ?? createdAt`; payments use `createdAt`; refunds use `completedAt ?? createdAt`.

### Shared contracts

Types in `packages/types/src/reports/financial/`:

- `FinancialSummary`, `RevenueTimelinePoint`, `PaymentReport`, `InvoiceReport`, `RefundReport`

Validation in `packages/validation/src/reports/financial/` for summary, revenue, payments, invoices, and refunds queries.

API client extensions on `ReportsClient`:

- `getFinancialSummary()`, `getRevenueTimeline()`, `getPaymentReport()`, `getInvoiceReport()`, `getRefundReport()`

### Authorization

- `reports:read` — staff and above (inherited from Sprint 9.0)

### Domain events

- `reports.financial.generated` — emitted for summary, revenue, payments, invoices, and refunds generation

### Audit

- Entity `financial_report`
- Actions `generate_summary`, `generate_revenue`, `generate_payments`, `generate_invoices`, `generate_refunds`

## Consequences

- Financial reporting composes existing repositories without duplicating payment or invoice business logic
- Bulk reads paginate orders and join invoices, payments, and refunds per order (same pattern as customer analytics)
- Net revenue subtracts completed refunds for accurate financial reconciliation
- Not every order has an invoice; payment and refund reports remain independent ledgers
- Warehouse filtering applies to order-derived revenue metrics via shared `report-utils`
