# ADR-0019: Shipment Tracking Timeline Architecture

## Status

Accepted — Sprint 7.4

## Context

Sprint 7.2–7.3 introduced the Shipment aggregate with lifecycle management and carrier gateway abstraction. Operators and future carrier integrations need an immutable historical timeline of tracking milestones that is independent from lifecycle state transitions.

## Decision

Introduce append-only **ShipmentTrackingEvent** records:

- Snapshots `shipment.status` at event creation time (`statusSnapshot`)
- Never updated or deleted after creation
- Listed oldest→newest by `createdAt`
- Creating events does not modify `shipment.status`

Domain event `shipment.tracking.updated` is emitted after successful append. Audit entity `shipment_tracking_event` records `create` actions at the route boundary.

## Consequences

- Timeline history survives even if shipment lifecycle advances separately
- Future carrier webhooks can append events without coupling to lifecycle policy
- Status snapshots provide point-in-time context for each timeline entry
