# ADR 0048: Notification Preferences Foundation

## Status

Accepted

## Date

2026-07-17

## Context

Sprints 10.0–10.5 established notification infrastructure, channel delivery, in-app center, background jobs, and domain event integration. Phase 5 requires a simple configuration layer so users can control which channels they receive for supported notification categories without introducing automation rules, quiet hours, digests, or per-event customization.

Sprint 10.6 completes Phase 5 by adding persisted notification preferences and consulting them during domain notification dispatch.

## Decision

### Module layout

Notification preferences live in `apps/api/src/notification-preferences/`:

```
notification-preferences/
├── repositories/       # Prisma + memory
├── services/           # NotificationPreferenceService
├── routes/             # REST handlers
└── testing/
```

Shared contracts:

- `packages/types/src/notification-preferences/` — preference types and domain-event mapping
- `packages/validation/src/notification-preferences/` — query and update schemas
- `packages/api-client/src/notification-preferences/` — HTTP client

### Prisma model

Store-scoped `NotificationPreference` records include:

| Field | Purpose |
|-------|---------|
| `storeId`, `userId` | Tenant and recipient scope |
| `notificationType` | Category enum |
| `emailEnabled`, `smsEnabled`, `inAppEnabled` | Channel toggles |
| Unique `(storeId, userId, notificationType)` | One record per user/category |

### Supported categories

| Preference type | Domain events |
|-----------------|---------------|
| `order_updates` | `order.confirmed` |
| `payment_updates` | `payment.paid`, `payment.failed` |
| `shipment_updates` | `shipment.shipped`, `shipment.delivered` |
| `return_updates` | `return.completed` |
| `procurement_updates` | `purchase-order.received` |

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/notification-preferences?storeId=` | `notifications:read` |
| PUT | `/api/notification-preferences/:type` | `notifications:write` |

GET returns all five categories with effective values (defaults merged). PUT upserts the authenticated user's preference for the given category.

### Business rules

- One preference record per `(storeId, userId, notificationType)`.
- When no record exists, all channels default to enabled.
- `DomainNotificationService.dispatch()` filters mapped notifications through `NotificationPreferenceService.filterNotificationsForDispatch()` before creating notifications or deferred jobs.
- Disabled channels are skipped; notifications without a `userId` are not filtered (default enabled).
- Domain event `notification-preference.updated` emits on preference changes.
- Audit entity `notification_preference`, action `update`.

### RBAC

Reuse existing `notifications:read` and `notifications:write` permissions. No new permissions are introduced.

## Consequences

### Positive

- Completes Phase 5 configuration layer with minimal scope.
- Preference filtering is centralized in domain dispatch before job creation or send.
- Defaults preserve existing behavior until users opt out.

### Negative / deferred

- Email/SMS without a resolvable `userId` cannot be filtered by user preferences.
- Supplier procurement notifications do not map to user preferences in this sprint.
- Quiet hours, digests, automation rules, and workflow builders remain out of scope.

## References

- ADR 0042: Notification Infrastructure Foundation
- ADR 0047: Domain Notification Integration
