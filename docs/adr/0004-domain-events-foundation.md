# ADR 0004: Domain Events Foundation

## Status

Accepted

## Date

2026-07-14

## Context

CommerceFlow records administrative actions via immutable audit logs (ADR 0003) and enforces store authorization (ADR 0002). Internal modules may need to react to business state changes — for example, notifying downstream workflows when an order is confirmed or inventory is reserved — without coupling domain services to specific consumers.

Sprint 5.2 introduces an in-process domain event foundation. This is explicitly **not** event streaming, Kafka, RabbitMQ, webhooks, or a distributed event bus.

## Decision

### DomainEvent contract

Defined in `@commerceflow/types`:

| Field | Purpose |
|-------|---------|
| `id` | Unique event identifier |
| `occurredAt` | ISO timestamp of emission |
| `eventType` | Stable event name (e.g. `order.confirmed`) |
| `aggregateType` | Aggregate root type (`order`, `inventory_reservation`) |
| `aggregateId` | Aggregate instance identifier |
| `storeId` | Tenant boundary (nullable for future platform events) |
| `payload` | Typed event-specific data |

### Event types (Sprint 5.2)

| Event type | Emitted after |
|------------|---------------|
| `order.confirmed` | Order confirmation |
| `order.cancelled` | Order cancellation |
| `order.fulfilled` | Order fulfillment |
| `inventory.reserved` | Inventory reservation for a confirmed order |
| `inventory.released` | Reservation release |

### In-process dispatcher

`InMemoryDomainEventDispatcher` provides:

- `subscribe(eventType, handler)` — register handlers; returns unsubscribe function
- `publish(event)` — invoke handlers in subscription order

Handler failures are caught per handler and reported via `onHandlerFailure`. `publish()` never throws due to handler errors.

`DomainEventPublisher` wraps the dispatcher with typed factory methods and fire-and-forget `dispatch()` so domain services never depend on handler success.

### Emission placement

Events are emitted from **domain services** after successful repository mutations:

- `OrderService.transitionOrder` → `order.confirmed` / `order.cancelled`
- `FulfillmentService.fulfillOrder` → `order.fulfilled`
- `ReservationService.reserveOrder` → `inventory.reserved`
- `ReservationService.releaseReservation` → `inventory.released`

No public REST endpoints expose domain events.

### Audit logs vs domain events

| Concern | Audit logs (ADR 0003) | Domain events (ADR 0004) |
|---------|-------------------------|--------------------------|
| **Purpose** | Compliance / admin accountability | Internal application reactions |
| **Actor** | `userId`, `sessionId` required | Business facts only |
| **Persistence** | Durable `AuditLog` table | In-memory dispatch (Sprint 5.2) |
| **Consumers** | Read via `GET /api/audit-logs` | In-process handlers only |
| **Failure model** | Post-commit best-effort write | Handler failure isolation |
| **Mutability** | Append-only | Ephemeral dispatch |

Audit answers *who did what*. Domain events answer *what happened in the business*.

### Transaction model

Events are emitted **after** the domain repository mutation succeeds, in a separate in-process step. Handler failures do not roll back business state and do not fail the calling service method.

## Consequences

### Positive

- Domain services remain decoupled from specific downstream consumers.
- Handlers can be added without modifying core business logic.
- Failure isolation protects business transactions from handler bugs.
- Foundation can evolve toward outbox or external bus without changing event contracts.

### Negative / trade-offs

- Events are not durable in Sprint 5.2 — process restart loses in-flight handler work.
- Global singleton dispatcher in production; tests inject isolated instances.
- No guaranteed delivery or retry (acceptable for in-process foundation).

## Future extension points

- **Transactional outbox**: Persist events in the same DB transaction as business writes, then dispatch asynchronously.
- **External event bus**: Replace `InMemoryDomainEventDispatcher` with adapter implementing the same interface.
- **Additional event types**: New factories and emission points as domains grow.
- **Handler registry**: Module-level registration at application bootstrap.
- **Correlation / causation IDs**: Link events across sagas.

## References

- `apps/api/src/domain-events/`
- `packages/types/src/domain-events/`
- ADR 0003 — Audit Logging Foundation
- ADR 0002 — Store Authorization and Permission Model
