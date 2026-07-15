# ADR 0023: Warehouse Picking & Packing Architecture

## Status

Accepted — Sprint 7.8

## Context

Sprint 7.2 introduced shipments and Sprint 7.7 added multi-package support. Warehouse operations need a structured picking workflow between order fulfillment and physical packing.

## Decision

Introduce `PickList` and `PickListItem` as shipment-scoped warehouse aggregates. Pick lists are auto-populated from order line items at creation and progress through `pending → picking → picked → packed`. Only one active pick list is allowed per shipment. Picking must complete before the pick list can be marked packed.

## Consequences

- Warehouse operators can track pick progress per order line item without mutating inventory.
- Pick list lifecycle is independent from shipment lifecycle but blocked on delivered/cancelled shipments.
- Future sprints can gate shipment packing on a packed pick list or integrate scanner workflows.
