# ADR 0042: Notification Infrastructure Foundation

## Status

Accepted

## Date

2026-07-16

## Context

Phase 5 (Notifications & Automation) requires a provider-agnostic delivery foundation before domain-specific notifications, templates, scheduling, or background workers are introduced.

Sprint 10.0 establishes persistence, provider abstraction, REST API access, domain events, audit logging, and RBAC for store-scoped notifications only.

## Decision

### Module layout

Notification infrastructure lives in `apps/api/src/notifications/`:

```
notifications/
├── errors/
├── providers/          # Console + Memory adapters, factory
├── repositories/       # Prisma + memory
├── services/           # Orchestration, events
├── routes/             # HTTP handlers
└── testing/
```

Shared contracts:

- `packages/types/src/notifications/` — domain types and provider interface
- `packages/validation/src/notifications/` — Zod schemas
- `packages/api-client/src/notifications/` — HTTP client

### Persistence

`Notification` Prisma model stores store-scoped records with:

- Optional `userId` and `customerId` recipients
- `channel` (`email`, `sms`, `in_app`, `webhook`)
- `status` (`pending`, `sent`, `failed`)
- Content fields (`subject`, `title`, `body`) and optional `metadata` JSON
- `sentAt` timestamp when delivery succeeds

No soft delete — notifications are append-only operational records for this sprint.

### Provider abstraction

`NotificationProvider` interface with `send()` returning `NotificationResult`.

| Provider | Purpose |
|----------|---------|
| `ConsoleNotificationProvider` | Logs payloads for local development |
| `MemoryNotificationProvider` | Captures deliveries for automated tests |

`DefaultNotificationProviderFactory` resolves providers by `NotificationProviderType` (`console`, `memory`), mirroring `PaymentGatewayFactory` and `ShipmentCarrierGatewayFactory`.

Providers perform delivery I/O only. They do not emit domain events or write audit entries.

Both providers support `metadata.simulateProviderFailure` for failure-path testing without outbound network calls.

### Create-and-send flow

`POST /api/notifications` creates a `pending` record, emits `notification.created`, invokes the selected provider synchronously, then:

1. **Success** — transition to `sent`, set `sentAt`, emit `notification.sent`
2. **Failure** — transition to `failed`, emit `notification.failed`

Provider failures must not corrupt persistence: the pending record remains valid if a status update fails; failed delivery always attempts to persist `failed` status rather than leaving ambiguous state.

No retries, templates, scheduling, or background workers in this sprint.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/notifications` | `notifications:write` |
| GET | `/api/notifications` | `notifications:read` |
| GET | `/api/notifications/:id` | `notifications:read` |

All endpoints are store-scoped via `storeId` query parameter or request body.

### Domain events

| Event | When |
|-------|------|
| `notification.created` | After pending record persisted |
| `notification.sent` | After successful provider delivery and status update |
| `notification.failed` | After provider failure and status update |

Aggregate type: `notification`.

### Audit

Entity type: `notification`.

| Action | When |
|--------|------|
| `create` | Notification record created |
| `send` | Delivery succeeded |
| `fail` | Delivery failed |

### RBAC

| Permission | owner/admin/manager | staff |
|------------|---------------------|-------|
| `notifications:read` | yes | yes |
| `notifications:write` | yes | no |

### Out of scope (future sprints)

- Email/SMS/webhook provider integrations (SendGrid, Twilio, etc.)
- Notification templates
- Scheduled and deferred delivery
- Background workers and retry policies
- Domain-specific notification triggers (order shipped, low stock, etc.)

## Consequences

- CommerceFlow has a testable notification pipeline with clear extension points for real providers.
- Synchronous delivery keeps Sprint 10.0 simple; async workers can subscribe to domain events later.
- Store isolation is enforced at repository and authorization layers consistent with other domains.
