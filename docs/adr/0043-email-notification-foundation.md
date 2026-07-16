# ADR 0043: Email Notification Foundation

## Status

Accepted

## Date

2026-07-16

## Context

Sprint 10.0 introduced provider-agnostic notification persistence and generic delivery adapters. Sprint 10.1 extends that foundation with a dedicated plain-text email layer that remains independent of SMTP, SendGrid, SES, or any other real email service.

The email layer must integrate with `NotificationService` for `channel = email` while preserving the existing notification lifecycle, audit model, and RBAC from Sprint 10.0.

## Decision

### Module layout

Email delivery lives in `apps/api/src/notifications/email/`:

```
email/
├── errors/
├── providers/          # Console + Memory email adapters, factory
├── services/           # EmailService orchestration + email domain events
└── routes/             # Test email endpoint handler
```

Shared contracts:

- `packages/types/src/notifications/email/` — `EmailMessage`, `EmailRecipient`, `EmailSendResult`, `EmailProvider`
- `packages/validation/src/notifications/email/` — test email and recipient schemas

Notification persistence continues to use the Sprint 10.0 `NotificationRepository`.

### Email provider abstraction

`EmailProvider` exposes a single operation:

| Operation | Meaning |
|-----------|---------|
| `sendEmail(message)` | Deliver a plain-text email payload |

| Provider | Purpose |
|----------|---------|
| `ConsoleEmailProvider` | Logs email payloads for local development |
| `MemoryEmailProvider` | Captures deliveries for automated tests |

`DefaultEmailProviderFactory` resolves adapters by `EmailProviderType` (`console`, `memory`), consistent with `PaymentGatewayFactory`, `ShipmentCarrierGatewayFactory`, and `NotificationProviderFactory`.

Providers perform delivery I/O only. They do not emit domain events or write audit entries.

Both providers support `metadata.simulateProviderFailure` for failure-path testing without outbound network calls.

### Plain-text constraints

Sprint 10.1 supports plain-text email only:

- Required `subject` and `body`
- Single `to` recipient
- No HTML templates
- No attachments
- No retries, scheduling, or queues

### Notification integration

When `NotificationService.createNotification()` receives `channel = email`:

1. Persist notification as `pending` and emit `notification.created`
2. Build an `EmailMessage` from the notification plus validated `to` recipient
3. Delegate delivery to `EmailService.sendEmail()`
4. Emit `email.sent` or `email.failed`
5. Transition notification to `sent` or `failed` and emit `notification.sent` or `notification.failed`

Non-email channels continue to use the generic `NotificationProvider` path unchanged.

Create payloads with `channel = email` require a validated `to` recipient via `emailRecipientSchema`.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/notifications/email/test` | `notifications:write` |

The test endpoint creates a store-scoped notification with `channel = email`, sends it synchronously through the email provider layer, and returns the resulting notification record.

### Domain events

| Event | When |
|-------|------|
| `email.sent` | After successful email provider delivery |
| `email.failed` | After email provider failure |

Aggregate type: `email_notification`.

Notification-level events (`notification.created`, `notification.sent`, `notification.failed`) continue to fire for email channel notifications.

### Audit

Entity type: `email_notification`.

| Action | When |
|--------|------|
| `send` | Email delivery succeeded |
| `fail` | Email delivery failed |

The test endpoint also records standard `notification` audit entries (`create`, `send`, `fail`).

### RBAC

Reuses existing `notifications:write` permission for the test endpoint. No new permissions introduced.

### Out of scope (future sprints)

- SMTP and third-party providers (SendGrid, SES, Mailgun, Postmark, Resend)
- HTML templates and template rendering
- Attachments
- Retry policies, queues, and scheduled delivery
- Domain-specific email triggers (order confirmation, password reset, etc.)

## Consequences

- Email delivery is testable and swappable without changing notification persistence or public notification APIs.
- `NotificationService` routes by channel, keeping email concerns isolated while preserving a unified notification record model.
- Future real email providers can be registered in `DefaultEmailProviderFactory` without modifying route handlers or notification contracts.
