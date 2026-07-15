# ADR 0022: Shipment Package Architecture

## Status

Accepted — Sprint 7.7

## Context

Sprint 7.2 introduced a single Shipment aggregate per fulfilled order. Warehouse operations often split one shipment into multiple physical parcels with independent dimensions, weights, and future per-package carrier tracking.

## Decision

Add a `ShipmentPackage` child entity with a one-to-many relationship to `Shipment`. Packages store warehouse-focused dimensions and optional package-level tracking numbers independent from shipment-level tracking.

Package CRUD is exposed via nested routes under shipments and flat routes by package id. Mutations are blocked when the parent shipment is `delivered` or `cancelled`. Package numbers are auto-generated store-wide unique identifiers.

## Consequences

- Shipments can contain multiple packages while retaining the existing shipment lifecycle.
- Package data prepares the platform for future carrier integrations with per-package labels and tracking.
- Shipment lifecycle transitions remain unchanged; package management is a parallel warehouse concern.
