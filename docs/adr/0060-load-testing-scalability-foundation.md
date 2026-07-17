# ADR 0060: Load Testing & Scalability Foundation

## Status

Accepted

## Date

2026-07-17

## Context

Sprint 12.4 establishes configuration, baselines, and scalability assessment for capacity planning. CommerceFlow does not execute load generators in this sprint; it stores campaign parameters and reports advisory readiness.

## Decision

### Module layout

Load testing foundation lives in `apps/api/src/load-testing/`:

```
load-testing/
├── repositories/       # PlatformConfiguration.loadTestingConfiguration
├── services/           # LoadTesting, PerformanceBaseline, ScalabilityAssessment
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/load-testing/`
- `packages/validation/src/load-testing/`
- `packages/api-client/src/load-testing/`

### Persistence

`PlatformConfiguration` is extended with `loadTestingConfiguration` (JSON).

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/platform/load-testing` | `platform:read` |
| PATCH | `/api/platform/load-testing` | `platform:write` |
| GET | `/api/platform/load-testing/baselines` | `platform:read` |
| GET | `/api/platform/scalability` | `platform:read` |

### Capabilities

- Load test configuration (tool preference, VUs, duration, ramp-up)
- Curated endpoint performance baseline inventory
- Scalability assessment with capacity planning recommendations
- Aggregate load-testing summary for operators

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `platform.load-testing.updated` | `platform` |

Audit entity: `platform`. Action: `load_testing_configuration_update`.

## Consequences

### Positive

- Capacity planning parameters and baselines are visible through the platform API.
- Assessments highlight risky VU targets relative to declared endpoint max RPS.

### Negative

- Baselines are curated defaults, not live measurements from executed suites.
- No automated runner integration; operators must execute tools externally.

### Out of scope (explicit)

- k6, JMeter, and Gatling execution
- Distributed load generators and cloud performance testing
- Auto-scaling
