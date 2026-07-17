# ADR 0059: Backup, Recovery & Disaster Readiness

## Status

Accepted

## Date

2026-07-17

## Context

Sprint 12.3 establishes operator visibility into backup posture, recovery objectives, and disaster readiness checklists. CommerceFlow does not execute backups or restores in this sprint; it records configuration and verification status for operational planning.

## Decision

### Module layout

Disaster readiness lives in `apps/api/src/disaster-readiness/`:

```
disaster-readiness/
├── repositories/       # PlatformConfiguration backup/recovery JSON
├── services/           # BackupVerification, RecoveryPlan, DisasterReadiness, Facade
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/disaster-readiness/`
- `packages/validation/src/disaster-readiness/`
- `packages/api-client/src/disaster-readiness/`

### Persistence

`PlatformConfiguration` is extended with:

- `backupConfiguration` (JSON)
- `recoveryObjectives` (JSON)

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/platform/backups` | `platform:read` |
| GET | `/api/platform/backups/verification` | `platform:read` |
| GET | `/api/platform/recovery` | `platform:read` |
| PATCH | `/api/platform/recovery` | `platform:write` |
| GET | `/api/platform/disaster-readiness` | `platform:read` |

PATCH updates RPO/RTO only. Backup execution remains external.

### Capabilities

- Backup configuration diagnostics and verification freshness checks
- Recovery checklist generation with configured RPO/RTO
- Aggregate disaster readiness summary (`ready` / `needs_attention` / `not_ready`)

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `platform.recovery-objectives.updated` | `platform` |

Audit entity: `platform`. Action: `recovery_objectives_update`.

## Consequences

### Positive

- Operators can track recovery objectives and verification freshness without leaving the platform API.
- Checklists provide a repeatable recovery procedure template.

### Negative

- Verification depends on manually recorded timestamps; CommerceFlow does not probe backup systems.
- Readiness is advisory and does not trigger automated failover.

### Out of scope (explicit)

- Physical database backups and restore execution
- Cloud backup providers, replication, and cross-region failover
- Automated disaster recovery orchestration
