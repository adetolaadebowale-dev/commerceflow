# ADR 0058: Observability & Structured Logging

## Status

Accepted

## Date

2026-07-17

## Context

Sprint 12.2 strengthens Production Hardening with structured application logging, request correlation, and operator-facing logging diagnostics — without adopting external logging, APM, or tracing platforms.

## Decision

### Module layout

Observability lives in `apps/api/src/observability/`:

```
observability/
├── services/           # Logging, RequestCorrelation, DiagnosticsLog, Facade
├── routes/             # REST handlers
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/observability/`
- `packages/validation/src/observability/`
- `packages/api-client/src/observability/`

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/platform/logging` | `platform:read` |
| GET | `/api/platform/logging/diagnostics` | `platform:read` |

Authenticated endpoints require `storeId` and reuse Sprint 11.6 RBAC.

### Capabilities

- **Structured logging**: JSON-serializable log entries with level, message, timestamp, correlation metadata, and standardized error fields
- **Correlation IDs**: generate or accept `x-correlation-id` / `x-request-id`, bind to request context, clear on response completion
- **Request/response logging**: `request.started` / `request.completed` entries with method, path, status, duration
- **Error logging**: capture name/message/stack with optional metadata
- **Operational summaries**: counts by level, recent entries, active correlation contexts

### Audit

Entity: `platform`. Action: `logging_diagnostics` (recorded for diagnostics reads).

### Domain events

None.

## Consequences

### Positive

- Operators can inspect recent structured logs and correlation state via platform APIs.
- Correlation IDs provide a foundation for later request tracing without vendor lock-in.

### Negative

- Log buffers are in-process and reset on restart; not shared across instances.
- Request logging is opt-in at call sites; this sprint does not wrap every route automatically.

### Out of scope (explicit)

- OpenTelemetry and distributed tracing
- ELK, Loki, Datadog, Splunk, and cloud logging services
