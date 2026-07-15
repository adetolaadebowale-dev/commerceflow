# ADR 0026: Warehouse Returns Architecture

## Status

Accepted — Sprint 8.1

## Context

Sprint 8.0 introduced immutable stock movements and shipment fulfillment. CommerceFlow now needs a structured warehouse returns workflow that records customer return requests, receives goods, inspects condition, and restocks approved inventory without mutating historical ledger entries.

## Decision

Introduce a store-scoped **Return** aggregate with **ReturnItem** line records and a lifecycle: `requested → received → inspecting → completed | rejected`.

### Restock rules

- Only items in `new` or `opened` condition are restocked
- `damaged` and `defective` items complete as rejected with zero restock
- Completion creates positive `StockMovement` rows with `movementType: return`

### Validation

- Shipment must be warehouse-fulfilled (`fulfilledAt` set)
- Return quantities cannot exceed remaining fulfilled order quantity
- Completed returns are immutable terminal states

## Consequences

- Returns reuse existing inventory RBAC permissions
- Stock movement ledger remains append-only
- Partial returns and mixed-condition lines are supported in one aggregate
