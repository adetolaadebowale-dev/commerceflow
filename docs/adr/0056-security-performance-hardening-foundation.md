# ADR 0056: Security & Performance Hardening Foundation

## Status

Accepted

## Date

2026-07-17

## Context

Sprint 12.0 begins Production Hardening by adding internal security and performance diagnostics without changing business behavior or adopting external security/monitoring platforms.

## Decision

### Module layout

Hardening capabilities live in `apps/api/src/platform-hardening/`:

```
platform-hardening/
├── repositories/       # Cache policy persistence (Prisma + memory)
├── services/           # Security, RateLimit, CachePolicy, Performance, Facade
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/platform-hardening/`
- `packages/validation/src/platform-hardening/`
- `packages/api-client/src/platform-hardening/`

### Persistence

Cache policy definitions are stored as JSON on the existing singleton `PlatformConfiguration.cachePolicies` column. Rate-limit counters and performance samples remain in-process memory only.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/platform/security` | `platform:read` |
| GET | `/api/platform/performance` | `platform:read` |
| GET | `/api/platform/cache-policies` | `platform:read` |
| PATCH | `/api/platform/cache-policies` | `platform:write` |
| GET | `/api/platform/rate-limits` | `platform:read` |

Authenticated endpoints require `storeId` and reuse Sprint 11.6 RBAC (`platform:read` owner/admin, `platform:write` owner only).

### Capabilities

- **Security diagnostics**: validates secrets, database URL, transport hints, and enabled rate-limit policies
- **Rate limiting**: configurable in-memory policies for selected endpoint keys (`auth.login`, `auth.register`, `platform.diagnostics`)
- **Cache policies**: definition-only TTL/enablement settings for read-heavy resources
- **Performance diagnostics**: in-memory timing summaries and slow-operation reports

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `platform.cache-policy.updated` | `platform` |

Audit entity: `platform`. Action: `cache_policy_update`.

## Consequences

### Positive

- Operators can inspect security posture, cache intent, rate-limit state, and timing hotspots from one API surface.
- Hardening is additive and does not alter catalogue/order business rules.

### Negative

- In-memory rate limits and timings reset on process restart and do not coordinate across instances.
- Cache policies are advisory definitions only; no cache runtime is implemented.

### Out of scope (explicit)

- Redis and distributed caching/rate limiting
- CDN and WAF integrations
- OpenTelemetry, DDoS mitigation, and cloud security services
