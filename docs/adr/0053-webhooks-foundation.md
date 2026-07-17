# ADR 0053: Webhooks Foundation

## Status

Accepted

## Date

2026-07-17

## Context

External systems integrating with CommerceFlow need timely notification of business events. Sprint 11.4 establishes an outbound webhook framework with endpoint management, HMAC-signed synchronous delivery, and delivery history — without retries, scheduling, or advanced delivery policies.

## Decision

### Module layout

Webhook infrastructure lives in `apps/api/src/webhooks/`:

```
webhooks/
├── repositories/       # Prisma + memory
├── services/           # WebhookService, WebhookDeliveryService, SignatureService
├── routes/             # REST handlers
├── integrations/       # Domain event handler registration
├── errors/
└── testing/
```

Shared contracts:

- `packages/types/src/webhooks/`
- `packages/validation/src/webhooks/`
- `packages/api-client/src/webhooks/`

### Prisma models

| Model | Table | Purpose |
|-------|-------|---------|
| `WebhookEndpoint` | `webhook_endpoints` | Registered callback URL, secret, subscriptions |
| `WebhookDelivery` | `webhook_deliveries` | Delivery attempt history |

The signing secret is stored server-side in the `secret` column and returned only once at endpoint creation.

### Security

- HMAC-SHA256 signatures over `${timestamp}.${jsonBody}`
- Headers: `X-Webhook-Timestamp`, `X-Webhook-Signature` (`t=...,v1=...`)
- Secrets never included in list/get API responses after creation

### REST API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/webhooks` | `webhooks:write` |
| GET | `/api/webhooks` | `webhooks:read` |
| GET | `/api/webhooks/:id` | `webhooks:read` |
| PATCH | `/api/webhooks/:id` | `webhooks:write` |
| GET | `/api/webhooks/:id/deliveries` | `webhooks:read` |

PATCH supports enabling/disabling endpoints, updating URL, and subscribed events.

### Delivery workflow

1. Domain event published via existing dispatcher
2. `registerWebhookDomainEventHandlers` invokes `WebhookDeliveryService.deliverDomainEvent`
3. Enabled endpoints subscribed to the event type receive a synchronous HTTP POST
4. Delivery record created (`pending` → `delivered` or `failed`)
5. Domain events: `webhook.delivery.completed` or `webhook.delivery.failed`

Disabled endpoints are skipped. No retry on failure.

### RBAC

| Permission | owner/admin | manager | staff |
|------------|-------------|---------|-------|
| `webhooks:read` | yes | yes | yes |
| `webhooks:write` | yes | yes | no |

### Domain events and audit

| Event | Aggregate |
|-------|-----------|
| `webhook.created` | webhook |
| `webhook.updated` | webhook |
| `webhook.delivery.completed` | webhook_delivery |
| `webhook.delivery.failed` | webhook_delivery |

Audit entity: `webhook`. Actions: `create`, `update`, `deliver`.

## Consequences

### Positive

- External systems can subscribe to business events with signed, verifiable payloads.
- Delivery history provides observability for integration debugging.
- Domain event integration enables automatic dispatch without polling.

### Negative

- Delivery is synchronous and blocking; slow endpoints delay event handler completion.
- No retry means transient failures require manual re-delivery (future sprint).

### Out of scope (explicit)

- Retry queues and exponential backoff
- Dead-letter queues
- Webhook replay
- Delivery scheduling and batching
- Webhook versioning
