# ADR-0018: Shipment Carrier Gateway Architecture

## Status

Accepted — Sprint 7.3

## Context

Sprint 7.2 introduced the Shipment aggregate with `internal` and `manual` carriers as enum values only. CommerceFlow now needs a provider-agnostic carrier gateway abstraction so future FedEx, UPS, DHL, and regional carrier integrations can be added without rewriting `ShipmentService`.

Sprint 7.3 introduces the gateway layer only — no outbound HTTP, no real carrier SDKs, no label generation.

## Decision

### Dependency inversion

`ShipmentService` depends on `ShipmentCarrierGateway` and `ShipmentCarrierGatewayFactory`, not on concrete carrier implementations. Adapters are injected at composition root (production singleton) or test setup.

### Adapter pattern

Each carrier implements `ShipmentCarrierGateway`:

| Operation | ShipmentService trigger | Gateway meaning |
|-----------|-------------------------|-----------------|
| `initializeShipment` | `createShipment` | Open carrier session / validate shipment |
| `dispatchShipment` | `shipShipment` | Hand off to carrier; assign tracking |
| `cancelShipment` | `cancelShipment` | Void carrier shipment |
| `verifyShipment` | *(reserved)* | Reconcile carrier tracking status |

`InternalShipmentCarrierGateway` simulates dispatch with synthetic tracking numbers. `ManualShipmentCarrierGateway` accepts operator-provided tracking numbers.

### Gateway failure handling

Gateway operations run **before** repository status transitions. On `success: false`, `ShipmentService` throws `SHIPMENT_CARRIER_ERROR` (502) and the shipment remains in its prior state.

Unsupported carriers throw `SHIPMENT_UNSUPPORTED_CARRIER` (400) from the factory.

### Unchanged surfaces

Domain events, audit logging, RBAC permissions, and REST API contracts remain unchanged from Sprint 7.2.

## Consequences

- Clean seam for external carrier integration
- ShipmentService testable with stub gateways
- Synthetic tracking numbers generated at dispatch for internal carrier
- `verifyShipment` reserved for future reconciliation endpoints
