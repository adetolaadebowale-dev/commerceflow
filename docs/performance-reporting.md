# Reporting Performance (Sprint 15.3)

Date: 2026-07-20  
Scope: Replace report full-dataset domain paging / N+1 joins with Prisma-backed queries.

## Production behavior

Default report repositories now use **Prisma**:

| Domain | Implementation |
|--------|----------------|
| Sales | `PrismaSalesReportRepository` |
| Financial | `PrismaFinancialReportRepository` |
| Customers | `PrismaCustomerReportRepository` |
| Inventory | `PrismaInventoryReportRepository` |

Patterns:

- Store-scoped `findMany` with **selective `select`**
- Nested relations for payments / refunds / order numbers / shipment warehouse (no N+1)
- Inventory reservations via **`groupBy` + `_sum`**
- Endpoint-specific fact loading (financial / inventory / procurement services skip unused ledgers)

Legacy `Default*ReportRepository` classes remain for reference / fallback composition but are no longer the production getters.

## Admin Reports React Query

Report hooks use `staleTime: 60_000` (`REPORT_QUERY_STALE_TIME_MS`) to reduce refetch churn. Query keys remain store + date-range scoped under `["reports", ...]`.

## Operator notes

- Prefer filtered date ranges on heavy stores; date filtering for some metrics remains in-process after the DB read (report timestamps are derived fields).
- Tabular report pagination is still applied after fact load for API contract compatibility; prefer small `limit` values from clients.
- Executive dashboard still fans out domain summaries; each summary is now far cheaper than the former page-all path.
- Do not reintroduce domain-repository paging loops in report getters without a measured need.
