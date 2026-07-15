# ADR 0034: Phase 3 Operational Readiness

## Status

Accepted — Sprint 8.9

## Context

Sprints 8.2 through 8.8 delivered the Phase 3 Shipping & Fulfillment Operations subsystem: suppliers, purchase orders, multi-warehouse inventory, replenishment, picking, allocation, shipments, fulfillment, returns, and cross-domain integrity validation (ADR 0033). Phase 3 requires a final integration pass that validates end-to-end operational consistency, produces a production readiness report, and documents the subsystem for go-live — without introducing new business aggregates.

## Decision

### Phase3ReadinessService

Add `Phase3ReadinessService` to `apps/api/src/operations/` composing existing validation services and extending checks for:

- Orphaned records (pick lists, allocations, reservations, returns, inventory items)
- Invalid lifecycle combinations (shipment progression without fulfillment, completed returns on unshipped shipments)
- Snapshot reference integrity (purchase orders and replenishment rules → suppliers)
- Stock ledger consistency (negative on-hand, reservations exceeding on-hand)
- Warehouse integrity (multiple defaults, inactive warehouses with stock)

### Readiness report

Introduce `Phase3ReadinessReport` with health sections for warehouse, inventory, fulfillment, procurement, shipment, return, and replenishment domains. Overall status:

- `READY` — no integrity failures and no operational warnings
- `WARNING` — no failures but pending recommendations, low stock, open returns, or draft POs
- `FAILED` — one or more integrity violations

### API endpoints

- `GET /api/operations/readiness-report` (`operations:read`) — generates report, audits `readiness_report`
- `POST /api/operations/run-phase3-validation` (`operations:run`) — runs validation, audits `phase3_validation`

### Domain events

- `operations.phase3.validation.completed`
- `operations.readiness.generated`

### Audit

Extend entity `operations` with actions `phase3_validation` and `readiness_report`.

### Documentation

- `docs/architecture/phase3-operational-readiness.md` — Phase 3 subsystem reference
- Update `docs/engineering/engineering-playbook.md` with Phase 3 operations reference

## Consequences

- Phase 3 go-live can be gated on objective readiness criteria
- Operations teams have a single report covering all warehouse, fulfillment, and procurement health indicators
- Validation composes existing domain snapshots; write paths remain unchanged
- Future sprints can schedule automated readiness checks or alerting on `FAILED` status
