# ADR 0020: Shipping Configuration Architecture

## Status

Accepted — Sprint 7.5

## Context

CommerceFlow needs merchant-configurable shipping zones and flat-rate shipping methods before checkout can calculate delivery costs. Sprint 7.5 introduces configuration-only aggregates with no checkout integration and no rate calculation at order time.

## Decision

Introduce two store-scoped aggregates:

- **ShippingZone** — groups ISO 3166-1 alpha-2 country codes with an active/inactive lifecycle.
- **ShippingMethod** — belongs to exactly one zone, carries a carrier reference (`internal` / `manual`), flat rate, and currency.

Both aggregates support soft delete. Business rules enforced in services:

- Country codes are unique within a zone.
- Flat rate must be ≥ 0; currency is required.
- Active methods require an active zone.
- Zones cannot be deleted or deactivated while active methods exist.

Configuration is exposed via REST under `/api/shipping-zones` and `/api/shipping-methods`, protected by `shipping-config:read` and `shipping-config:write` permissions.

Domain events (`shipping-zone.*`, `shipping-method.*`) and audit entries (`shipping_zone`, `shipping_method`) follow established CommerceFlow patterns.

## Consequences

- Checkout and cart flows remain unchanged until a future sprint wires zone/method resolution.
- Carrier values reuse the existing `ShipmentCarrier` enum for consistency with fulfillment shipments.
- Zone/method overlap across zones (same country in multiple zones) is allowed; resolution logic is deferred.
