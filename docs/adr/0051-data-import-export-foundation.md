# ADR 0051: Data Import & Export Foundation

## Status

Accepted

## Date

2026-07-17

## Context

CommerceFlow needs a provider-agnostic foundation for bulk data import and export across core business entities. Sprint 11.2 establishes the data model, service workflow, and REST APIs without implementing CSV parsing, file storage, background workers, or format-specific processors.

## Decision

### Module layout

Data transfer lives in `apps/api/src/data-transfer/`:

```
data-transfer/
├── repositories/       # ImportRepository, ExportRepository (Prisma + memory)
├── processors/         # Placeholder import/export processors
├── services/           # DataTransferService
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/data-transfer/` — job types, statuses, formats
- `packages/validation/src/data-transfer/` — create and list schemas
- `packages/api-client/src/data-transfer/` — HTTP client

### Prisma models

Two store-scoped models:

| Model | Table |
|-------|-------|
| `ImportJob` | `import_jobs` |
| `ExportJob` | `export_jobs` |

Shared fields: `type` (customers, products, inventory), `status` (pending, processing, completed, failed), `format` (csv), `metadata` JSON, timestamps, optional `completedAt` and `failureReason`.

### Workflow

Job creation is synchronous in this sprint:

1. Create job with `pending` status
2. Emit `import.created` / `export.created`
3. Transition to `processing`
4. Run placeholder processor (no CSV parsing)
5. Transition to `completed` or `failed`
6. Emit `import.completed` / `import.failed` or export equivalents

Placeholder processors return zero-row results and support `metadata.simulateFailure` for testing failure paths.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/imports` | `imports:write` |
| GET | `/api/imports` | `imports:read` |
| GET | `/api/imports/:id` | `imports:read` |
| POST | `/api/exports` | `exports:write` |
| GET | `/api/exports` | `exports:read` |
| GET | `/api/exports/:id` | `exports:read` |

All endpoints require `storeId` (body for POST, query for GET).

### RBAC

| Permission | owner/admin | manager | staff |
|------------|-------------|---------|-------|
| `imports:read` | yes | yes | yes |
| `imports:write` | yes | yes | no |
| `exports:read` | yes | yes | yes |
| `exports:write` | yes | yes | no |

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `import.created` | import |
| `import.completed` | import |
| `import.failed` | import |
| `export.created` | export |
| `export.completed` | export |
| `export.failed` | export |

Audit entity types: `import`, `export`. Actions: `create`, `complete`, `fail`.

## Consequences

### Positive

- Import/export job lifecycle is modeled and accessible through shared contracts.
- Placeholder processors allow future format-specific implementations without API changes.
- Store boundary and RBAC are preserved.

### Negative

- Processing is synchronous; large files will require background workers in a future sprint.
- Only CSV format is declared; no parsing or generation occurs yet.

### Out of scope (explicit)

- CSV parsing and generation
- XLSX support
- Cloud storage integration
- Streaming
- Background workers and scheduling
- Resumable imports
