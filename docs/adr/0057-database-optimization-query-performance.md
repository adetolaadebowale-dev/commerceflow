# ADR 0057: Database Optimization & Query Performance

## Status

Accepted

## Date

2026-07-17

## Context

Sprint 12.1 continues Production Hardening by improving operator visibility into database indexing and query performance without changing business behavior or introducing automatic schema mutations.

## Decision

### Module layout

Database optimization diagnostics live in `apps/api/src/database-optimization/`:

```
database-optimization/
├── catalog/            # Curated index inventory and baseline recommendations
├── services/           # QueryPerformance, IndexReview, DatabaseDiagnostics, Facade
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/database-optimization/`
- `packages/validation/src/database-optimization/`
- `packages/api-client/src/database-optimization/`

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/platform/database` | `platform:read` |
| GET | `/api/platform/database/indexes` | `platform:read` |
| GET | `/api/platform/database/diagnostics` | `platform:read` |

Authenticated endpoints require `storeId` and reuse Sprint 11.6 RBAC.

### Capabilities

- **Index inventory**: curated review of high-value Prisma/Postgres indexes (analysis only)
- **Slow query analysis**: in-process development diagnostics with thresholded samples
- **Query recommendations**: baseline guidance plus warnings for repeatedly slow query keys
- **Migration consistency**: validates migration directory naming and presence of recent foundation migrations
- **Database diagnostics summary**: combines reachability, indexes, query performance, and migrations

### Audit

Entity: `platform`. Action: `database_diagnostics` (recorded for summary and diagnostics reads).

### Domain events

None.

## Consequences

### Positive

- Operators can inspect index coverage and query hotspots without external APM tools.
- Migration naming/consistency issues surface early in diagnostics.

### Negative

- Index inventory is curated, not a live `pg_indexes` dump.
- Slow-query sampling is process-local and resets on restart.

### Out of scope (explicit)

- Automatic index creation
- Sharding, replication, and partitioning
- Database engine migration
- External monitoring services
