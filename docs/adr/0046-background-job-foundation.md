# ADR 0046: Background Job Foundation

## Status

Accepted

## Date

2026-07-16

## Context

Sprints 10.0–10.3 established notification infrastructure across email, SMS, and in-app channels. CommerceFlow now needs a lightweight internal foundation for deferred and scheduled work without introducing Redis, BullMQ, RabbitMQ, SQS, cron workers, distributed processing, retries, or recurring jobs.

Sprint 10.4 introduces persistence and manual execution for background jobs scoped to a store.

## Decision

### Prisma model

Store-scoped `Job` records include:

| Field | Purpose |
|-------|---------|
| `type` | Job identifier (`noop` in foundation sprint) |
| `status` | `pending`, `running`, `completed`, `failed` |
| `payload` | JSON execution input |
| `scheduledFor` | Planned execution time (stored only; not auto-triggered) |
| `startedAt`, `completedAt`, `failureReason` | Execution lifecycle metadata |

Indexes on `(store_id, status)` and `(store_id, scheduled_for)` support listing and future scheduling queries.

### Module layout

Background jobs live in `apps/api/src/jobs/`:

```
jobs/
├── errors/
├── executors/          # Console + Memory executors, factory
├── repositories/       # Prisma + Memory repositories
├── services/           # JobService + JobScheduler
├── routes/             # REST handlers
└── testing/            # Test module factory
```

Shared contracts:

- `packages/types/src/jobs/` — `Job`, `JobStatus`, `JobType`
- `packages/validation/src/jobs/` — create/list/query schemas
- `packages/api-client/src/jobs/` — `JobsClient`

### JobService and JobScheduler

| Component | Responsibility |
|-----------|----------------|
| `JobService.createJob` | Persist pending job, emit `job.created` |
| `JobService.runJob` | Manual execution only; pending → running → completed/failed |
| `JobScheduler` | Resolve and validate `scheduledFor`; `isDue()` helper without auto-run |

Execution uses a `JobExecutor` abstraction (`ConsoleJobExecutor`, `MemoryJobExecutor`) resolved by job type through `DefaultJobExecutorFactory`.

### Business rules

- Jobs are persisted before execution.
- Only `POST /api/jobs/:id/run` triggers execution.
- `scheduledFor` is stored but never automatically processed.
- Completed jobs cannot run again (`409 JOB_ALREADY_COMPLETED`).
- Only pending jobs can be executed.
- All operations are tenant-scoped by `storeId`.

### REST API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/jobs` | `jobs:write` |
| GET | `/api/jobs` | `jobs:read` |
| GET | `/api/jobs/:id` | `jobs:read` |
| POST | `/api/jobs/:id/run` | `jobs:write` |

### Domain events

| Event | When |
|-------|------|
| `job.created` | After job persistence |
| `job.started` | After transition to `running` |
| `job.completed` | After successful execution |
| `job.failed` | After failed execution |

Aggregate type: `job`.

### Audit

Entity type: `job`.

| Action | When |
|--------|------|
| `create` | Job created |
| `run` | Manual execution started |
| `complete` | Job completed successfully |
| `fail` | Job execution failed |

### RBAC

| Permission | Roles |
|------------|-------|
| `jobs:read` | owner, admin, manager, staff |
| `jobs:write` | owner, admin, manager |

### Out of scope (future sprints)

- Redis, BullMQ, RabbitMQ, SQS, and other external queues
- Cron workers and automatic scheduled execution
- Distributed processing, retries, and recurring jobs
- Domain-specific job handlers beyond the foundation `noop` type

## Consequences

- Background work can be persisted and manually executed with full audit and domain event coverage.
- Future queue or cron integrations can reuse the same repository and service contracts.
- `JobScheduler.isDue()` provides a query helper for future worker sprints without introducing automatic execution now.
