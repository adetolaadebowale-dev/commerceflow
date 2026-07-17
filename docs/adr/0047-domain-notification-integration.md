# ADR 0047: Domain Notification Integration

## Status

Accepted

## Date

2026-07-16

## Context

Sprints 10.0–10.4 established notification infrastructure (email, SMS, in-app), provider abstraction, audit logging, and a background job foundation. CommerceFlow now needs to connect the highest-value business events to that infrastructure without introducing new business aggregates, template rendering, workflow automation, or automatic workers.

Sprint 10.5 integrates seven existing domain events with `NotificationService` and deferred dispatch via `JobService` where configured.

## Decision

### Module layout

Domain notification integration lives in `apps/api/src/notifications/integrations/`:

```
integrations/
├── domain-notification-config.ts   # Default channel + defer settings
├── handlers/                       # Domain event subscriptions
├── mapping/                        # Event → CreateNotificationInput mappers
├── services/                       # DomainNotificationService
└── testing/                        # Test utilities
```

Shared contracts:

- `packages/types/src/notifications/integrations/` — config, dispatch result, contact DTOs
- Audit entity `domain_notification` with action `dispatch`
- Job type `notification.dispatch` for deferred creation

### Supported domain events

| Requirement name | Existing event type | Default channels |
|------------------|---------------------|------------------|
| `order.confirmed` | `order.confirmed` | email |
| `payment.completed` | `payment.paid` | email |
| `payment.failed` | `payment.failed` | email, sms |
| `shipment.shipped` | `shipment.shipped` | email (deferred) |
| `shipment.delivered` | `shipment.delivered` | email |
| `return.completed` | `return.completed` | email |
| `purchase-order.received` | `purchase-order.received` | email (supplier) |

The product requirement `payment.completed` maps to the existing `payment.paid` domain event. No duplicate business events are introduced.

### DomainNotificationService

`DomainNotificationService.dispatch()` accepts mapped `CreateNotificationInput[]` and:

1. Creates notifications immediately through `NotificationService.createNotification()` when `defer` is false.
2. Creates `notification.dispatch` jobs through `JobService.createJob()` when `defer` is true.
3. Records best-effort audit entries for entity `domain_notification`, action `dispatch`.

Plain-text subject/body/title fields are set in mappers. No HTML templates or rendering layer is added.

### Event handlers

`registerDomainNotificationHandlers()` subscribes to the seven event types on the shared domain event dispatcher. Handlers:

- Skip events without `storeId`.
- Resolve customer or supplier contacts through `DomainNotificationContactResolver`.
- Map events to notification inputs and call `DomainNotificationService.dispatch()`.

Handlers are registered from `apps/api/src/domain-events/index.ts` at application bootstrap.

### Contact resolution

| Event category | Contact source |
|----------------|----------------|
| Order, payment, shipment, return | Order customer via order repository; shipment shipping address as fallback |
| Purchase order received | Supplier primary contact via supplier repository |

### Deferred dispatch

Only `shipment.shipped` defaults to `defer: true`. Deferred jobs store `{ notificationInput, sourceEventType, sourceAggregateId }` and are executed manually through the existing job run API via `NotificationDispatchJobExecutor`. No automatic workers or queues are introduced.

### Notification lifecycle events

Notification lifecycle events (`notification.created`, `notification.sent`, `notification.failed`) continue to emit from `NotificationService` only. Domain handlers do not emit additional notification lifecycle events.

### RBAC

No new permissions are required. Domain notifications are system-driven side effects of existing business events.

## Consequences

### Positive

- Reuses notification and job foundations without new aggregates.
- Keeps channel routing and defer behavior configurable per event type.
- Provides audit traceability for domain-driven notification dispatch.
- Plain-text messages keep the integration simple until template work is scheduled.

### Negative / deferred

- Contact resolution depends on persisted customer/supplier records; guest orders without email may receive no notification.
- In-app channel requires explicit `userId` in configuration and is off by default.
- Deferred shipment notifications require manual job execution until scheduling automation is introduced.

## References

- ADR 0042: Notification Infrastructure Foundation
- ADR 0043: Email Notification Foundation
- ADR 0044: SMS Notification Foundation
- ADR 0045: In-App Notification Center
- ADR 0046: Background Job Foundation
