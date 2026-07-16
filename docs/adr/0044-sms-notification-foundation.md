# ADR 0044: SMS Notification Foundation

## Status

Accepted

## Date

2026-07-16

## Context

Sprint 10.0 introduced notification persistence and generic delivery adapters. Sprint 10.1 added a plain-text email layer with provider abstraction. Sprint 10.2 extends the same pattern to SMS delivery while remaining independent of Twilio, AWS SNS, Vonage, MessageBird, Africa's Talking, Termii, or any other real SMS provider.

The SMS layer must integrate with `NotificationService` for `channel = sms` while preserving existing email and generic notification paths.

## Decision

### Module layout

SMS delivery lives in `apps/api/src/notifications/sms/`:

```
sms/
├── errors/
├── providers/          # Console + Memory SMS adapters, factory
├── services/             # SmsService orchestration + SMS domain events
└── routes/               # Test SMS endpoint handler
```

Shared contracts:

- `packages/types/src/notifications/sms/` — `SmsMessage`, `SmsRecipient`, `SmsSendResult`, `SmsProvider`
- `packages/validation/src/notifications/sms/` — test SMS and recipient schemas

Notification persistence continues to use the Sprint 10.0 `NotificationRepository`.

### SMS provider abstraction

`SmsProvider` exposes a single operation:

| Operation | Meaning |
|-----------|---------|
| `sendSms(message)` | Deliver a plain-text SMS payload |

| Provider | Purpose |
|----------|---------|
| `ConsoleSmsProvider` | Logs SMS payloads for local development |
| `MemorySmsProvider` | Captures deliveries for automated tests |

`DefaultSmsProviderFactory` resolves adapters by `SmsProviderType` (`console`, `memory`), consistent with the email and generic notification provider factories.

Providers perform delivery I/O only. They do not emit domain events or write audit entries.

Both providers support `metadata.simulateProviderFailure` for failure-path testing without outbound network calls.

### Plain-text constraints

Sprint 10.2 supports plain-text SMS only:

- Required `body` and validated `smsTo.phone` recipient
- Single recipient per message
- No templates, attachments, delivery receipts, retries, scheduling, or queues

Phone numbers are validated as 7–15 digits with an optional leading `+`.

### Notification integration

When `NotificationService.createNotification()` receives `channel = sms`:

1. Persist notification as `pending` and emit `notification.created`
2. Build an `SmsMessage` from the notification plus validated `smsTo` recipient
3. Delegate delivery to `SmsService.sendSms()`
4. Emit `sms.sent` or `sms.failed`
5. Transition notification to `sent` or `failed` and emit `notification.sent` or `notification.failed`

Email and non-SMS channels remain unchanged.

Create payloads with `channel = sms` require a validated `smsTo` recipient via `smsRecipientSchema`.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/notifications/sms/test` | `notifications:write` |

The test endpoint creates a store-scoped notification with `channel = sms`, sends it synchronously through the SMS provider layer, and returns the resulting notification record.

### Domain events

| Event | When |
|-------|------|
| `sms.sent` | After successful SMS provider delivery |
| `sms.failed` | After SMS provider failure |

Aggregate type: `sms_notification`.

Notification-level events continue to fire for SMS channel notifications.

### Audit

Entity type: `sms_notification`.

| Action | When |
|--------|------|
| `send` | SMS delivery succeeded |
| `fail` | SMS delivery failed |

The test endpoint also records standard `notification` audit entries (`create`, `send`, `fail`).

### RBAC

Reuses existing `notifications:write` permission for the test endpoint. No new permissions introduced.

### Out of scope (future sprints)

- Twilio, AWS SNS, Vonage, MessageBird, Africa's Talking, Termii, and other real SMS providers
- Templates and template rendering
- Delivery receipts and status callbacks
- Retry policies, queues, and scheduled delivery
- Domain-specific SMS triggers (order updates, OTP codes, etc.)

## Consequences

- SMS delivery is testable and swappable without changing notification persistence or public notification APIs.
- `NotificationService` routes by channel, keeping SMS concerns isolated while preserving a unified notification record model.
- Future real SMS providers can be registered in `DefaultSmsProviderFactory` without modifying route handlers or notification contracts.
