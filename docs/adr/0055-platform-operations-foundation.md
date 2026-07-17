# ADR 0055: Platform Operations & Maintenance Foundation

## Status

Accepted

## Date

2026-07-17

## Context

CommerceFlow needs an internal operational foundation for production visibility and safe maintenance without adopting external monitoring platforms. Sprint 11.6 introduces health probes, diagnostics, job summaries, and maintenance mode administration.

## Decision

### Module layout

Platform operations live in `apps/api/src/platform-operations/`:

```
platform-operations/
├── repositories/       # Prisma + memory PlatformConfiguration
├── services/           # PlatformOperations, Health, Maintenance, Diagnostics
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/platform-operations/`
- `packages/validation/src/platform-operations/`
- `packages/api-client/src/platform-operations/`

### Persistence

| Model | Table | Purpose |
|-------|-------|---------|
| `PlatformConfiguration` | `platform_configurations` | Singleton maintenance mode settings |

Fields: `maintenanceMode`, `maintenanceMessage`, `updatedAt`.

### REST API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/platform/live` | Public liveness probe |
| GET | `/api/platform/ready` | Public readiness probe (database ping) |
| GET | `/api/platform/health` | `platform:read` + `storeId` |
| GET | `/api/platform/version` | `platform:read` + `storeId` |
| GET | `/api/platform/diagnostics` | `platform:read` + `storeId` |
| GET | `/api/platform/jobs/summary` | `platform:read` + `storeId` |
| PATCH | `/api/platform/maintenance` | `platform:write` + `storeId` |

Authenticated endpoints use store membership as the RBAC context. Job summaries are tenant-isolated by `storeId`.

### Capabilities

- Liveness: process is up
- Readiness: database connectivity
- Health: readiness + maintenance state
- Version: application name/version/environment/node
- Diagnostics: version, maintenance, configuration validation, job stats, health
- Job summary: counts by status from the existing Job module
- Maintenance mode: enable/disable with optional message

### RBAC

| Permission | owner | admin | manager | staff |
|------------|-------|-------|---------|-------|
| `platform:read` | yes | yes | no | no |
| `platform:write` | yes | no | no | no |

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `platform.maintenance.enabled` | `platform` |
| `platform.maintenance.disabled` | `platform` |

Audit entity: `platform`. Actions: `maintenance_enable`, `maintenance_disable`.

## Consequences

### Positive

- Operators can probe process health and inspect store-scoped job queues without third-party agents.
- Maintenance mode is auditable and evented for downstream integrations.
- Configuration validation surfaces missing operational secrets early.

### Negative

- Maintenance mode is platform-global; there is no per-store maintenance window yet.
- Public readiness/liveness endpoints expose minimal operational signals by design.

### Out of scope (explicit)

- Prometheus, Grafana, OpenTelemetry
- Kubernetes/Docker orchestration and auto-scaling
- Alerting systems and distributed tracing
- Cloud monitoring integrations
