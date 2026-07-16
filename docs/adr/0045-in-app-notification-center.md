# ADR 0045: In-App Notification Center

## Status

Accepted

## Date

2026-07-16

## Context

Sprints 10.0–10.2 established notification persistence, generic delivery adapters, and channel-specific email and SMS layers. The `in_app` channel already exists in the notification model and is dispatched through the generic notification provider, but there is no user-facing inbox for retrieving or managing in-app notifications.

Sprint 10.3 adds an in-app notification center focused on persistence and retrieval. It does not introduce WebSockets, push notifications, browser notifications, grouping, or real-time subscriptions.

## Decision

### Model extension

The existing `Notification` model gains an optional `readAt` timestamp:

- `readAt = null` → unread
- `readAt` set → read

Delivery lifecycle (`pending` → `sent` / `failed`) remains separate from read state. Only `sent` in-app notifications appear in a user's inbox.

Create payloads with `channel = in_app` require a `userId` so notifications are scoped to a user within a store.

A composite index on `(store_id, user_id, channel, read_at)` supports unread filtering.

### Module layout

In-app notification management lives in `apps/api/src/notifications/in-app/`:

```
in-app/
├── routes/               # List, get, mark read/unread handlers
└── services/             # InAppNotificationService + repository helpers
```

Shared contracts:

- `packages/types/src/notifications/in-app/` — `InAppNotification` DTO
- `packages/validation/src/notifications/in-app/` — list and scoped query schemas

The module reuses the Sprint 10.0 `NotificationRepository`, extended with `listInApp`, `markRead`, and `markUnread`.

### InAppNotificationService

| Operation | Behavior |
|-----------|----------|
| `listInAppNotifications` | Paginated inbox for a store user; optional `unreadOnly` filter |
| `getInAppNotification` | Single notification scoped to store + user |
| `markAsRead` | Sets `readAt`; idempotent when already read |
| `markAsUnread` | Clears `readAt`; idempotent when already unread |

Read/unread transitions emit domain events. Creation continues through `NotificationService.createNotification()` with `channel = in_app`.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/notifications/in-app` | `notifications:read` |
| GET | `/api/notifications/in-app/:id` | `notifications:read` |
| POST | `/api/notifications/in-app/:id/read` | `notifications:write` |
| POST | `/api/notifications/in-app/:id/unread` | `notifications:write` |

All endpoints require `storeId` and `userId` query parameters. List supports `page`, `limit`, and `unreadOnly`.

### Domain events

| Event | When |
|-------|------|
| `in-app-notification.read` | After marking a notification as read |
| `in-app-notification.unread` | After marking a notification as unread |

Aggregate type: `in_app_notification`.

### Audit

Entity type: `in_app_notification`.

| Action | When |
|--------|------|
| `read` | Notification marked as read |
| `unread` | Notification marked as unread |

### RBAC

Reuses existing `notifications:read` and `notifications:write` permissions. No new permissions introduced.

### Out of scope (future sprints)

- WebSockets and real-time push delivery
- Browser notifications and mobile push
- Notification grouping, batching, or digests
- Read-all or bulk mark operations
- Domain-specific in-app triggers beyond standard notification creation

## Consequences

- Users can retrieve and manage in-app notifications within a store without adding real-time infrastructure.
- Read state is persisted on the existing notification record, avoiding a separate inbox table.
- Future real-time layers can subscribe to `in-app-notification.read` / `unread` events without changing the persistence model.
