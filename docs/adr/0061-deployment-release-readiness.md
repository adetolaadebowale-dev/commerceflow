# ADR 0061: Deployment & Release Readiness

## Status

Accepted

## Date

2026-07-17

## Context

Sprint 12.5 completes Production Hardening with deployment readiness diagnostics, environment validation, and release metadata reporting. CommerceFlow does not execute deployments or integrate CI/CD platforms in this sprint.

## Decision

### Module layout

Deployment readiness lives in `apps/api/src/deployment-readiness/`:

```
deployment-readiness/
├── repositories/       # PlatformConfiguration.deploymentConfiguration
├── services/           # DeploymentReadiness, ReleaseValidation, EnvironmentDiagnostics
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/deployment-readiness/`
- `packages/validation/src/deployment-readiness/`
- `packages/api-client/src/deployment-readiness/`

### Persistence

`PlatformConfiguration` is extended with `deploymentConfiguration` (JSON).

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/platform/deployment` | `platform:read` |
| PATCH | `/api/platform/deployment` | `platform:write` |
| GET | `/api/platform/deployment/checklist` | `platform:read` |
| GET | `/api/platform/environment` | `platform:read` |
| GET | `/api/platform/release` | `platform:read` |

### Capabilities

- Deployment readiness summary (`ready` / `needs_attention` / `blocked`)
- Environment configuration validation (secrets, HTTPS, Node version)
- Release metadata and Node compatibility diagnostics
- Operational deployment checklist generation

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `platform.deployment-configuration.updated` | `platform` |

Audit entity: `platform`. Action: `deployment_configuration_update`.

## Consequences

### Positive

- Operators can gate releases on configuration and version readiness without leaving the platform API.
- Checklists provide a repeatable pre-deploy procedure.

### Negative

- Migration application status is advisory (injected/assumed), not a live Prisma migrate probe.
- No CI/CD orchestration; deployments remain external.

### Out of scope (explicit)

- GitHub Actions, GitLab CI, Azure DevOps, Jenkins
- Docker image publishing and Kubernetes deployment
- Cloud deployment services
