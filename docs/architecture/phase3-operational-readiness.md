# Phase 3 Operational Readiness

CommerceFlow Phase 3 covers **Shipping & Fulfillment Operations** — the end-to-end warehouse, inventory, procurement, shipping, and returns subsystem introduced across Sprints 8.2–8.9.

## Scope

Phase 3 domains:

| Domain | Responsibility |
|--------|----------------|
| Suppliers | Vendor master data and contacts |
| Purchase Orders | Procurement and warehouse receiving |
| Warehouses | Multi-warehouse topology |
| Warehouse Transfers | Inter-warehouse stock movement |
| Inventory | On-hand stock and stock movements |
| Replenishment | Reorder rules and recommendations |
| Reservations | Order stock holds |
| Pick Lists | Warehouse picking workflow |
| Inventory Allocations | Pick-to-bin allocation |
| Shipment Packages | Parcel composition |
| Shipments | Carrier dispatch lifecycle |
| Shipment Tracking | Delivery timeline events |
| Warehouse Fulfillment | Stock deduction on ship |
| Returns | Reverse logistics and restock |
| Inventory Adjustments | Manual stock corrections |
| Cycle Counts | Physical inventory reconciliation |
| Operations | Cross-domain integrity and readiness |

## Operational Lifecycle

The canonical Phase 3 workflow:

```
Supplier → Purchase Order → Warehouse Receiving → Inventory
    → Replenishment → Customer Order → Reservation → Picking
    → Inventory Allocation → Packaging → Shipment
    → Warehouse Fulfillment → Stock Movement → Delivery
    → Return → Inventory Restock
```

Each transition is enforced by domain services (status policies, repositories, and transactional boundaries). The operations layer validates consistency across these boundaries without duplicating write logic.

## Operations Layer

`apps/api/src/operations/` provides read-only orchestration:

| Service | Role |
|---------|------|
| `OperationalIntegrityService` | Cross-domain integrity checks and dashboards |
| `WarehouseConsistencyService` | Shipment/pick alignment, transfer conflicts |
| `InventoryIntegrityService` | Allocation release, replenishment staleness |
| `OperationsReadService` | Operational dashboard read models |
| `Phase3ReadinessService` | Phase 3 go-live validation and readiness reports |

### Snapshot Loading

`OperationsContextProvider` loads a store-scoped read snapshot from existing repositories. No new write models or aggregates are introduced.

### Integrity Validation

Sprint 8.8 validation rules cover shipment/pick state, transfer vs fulfillment conflicts, allocation release, adjustment consistency, and replenishment staleness after receiving, returns, and cycle counts.

### Phase 3 Readiness (Sprint 8.9)

`Phase3ReadinessService` extends integrity validation with:

- **Orphan detection** — pick lists, allocations, reservations, returns, and inventory items referencing missing parents
- **Lifecycle validation** — invalid state combinations (e.g. shipped shipment without fulfillment, completed return on unshipped shipment)
- **Snapshot integrity** — purchase orders and replenishment rules referencing missing suppliers
- **Stock ledger consistency** — negative on-hand quantities, reservations exceeding on-hand stock
- **Warehouse integrity** — multiple default warehouses, inactive warehouses holding stock

## Readiness Report

`GET /api/operations/readiness-report` returns a consolidated report:

| Section | Indicators |
|---------|------------|
| Warehouse health | Warehouse count, transfers, active shipments |
| Inventory health | Item count, low stock, reservations, cycle counts |
| Fulfillment health | Shipments, pick lists, open allocations |
| Procurement health | Suppliers, purchase orders |
| Shipment health | Active, in-transit, delivered counts |
| Return health | Open, completed, pending inspection |
| Replenishment health | Pending recommendations, active rules |

**Overall status:**

| Status | Meaning |
|--------|---------|
| `READY` | No integrity failures; no operational warnings |
| `WARNING` | No failures; pending recommendations, low stock, open returns, or draft POs |
| `FAILED` | One or more cross-domain integrity violations |

## API Endpoints

### Read models (`operations:read`)

- `GET /api/operations/warehouse-summary`
- `GET /api/operations/fulfillment-dashboard`
- `GET /api/operations/procurement-dashboard`
- `GET /api/operations/inventory-health`
- `GET /api/operations/readiness-report`

### Validation runs (`operations:run`)

- `POST /api/operations/integrity-check`
- `POST /api/operations/warehouse-validation`
- `POST /api/operations/inventory-validation`
- `POST /api/operations/run-phase3-validation`

## Authorization

| Permission | Access |
|------------|--------|
| `operations:read` | Dashboards and readiness report (staff+) |
| `operations:run` | Integrity and Phase 3 validation runs (manager+) |

## Domain Events

| Event | Trigger |
|-------|---------|
| `operations.integrity.checked` | Combined integrity check |
| `warehouse.integrity.checked` | Warehouse validation |
| `inventory.integrity.checked` | Inventory validation |
| `operations.phase3.validation.completed` | Phase 3 validation run |
| `operations.readiness.generated` | Readiness report generated |

## Audit

Entity: `operations`

| Action | Trigger |
|--------|---------|
| `integrity_check` | Combined integrity check |
| `warehouse_validation` | Warehouse validation |
| `inventory_validation` | Inventory validation |
| `phase3_validation` | Phase 3 validation run |
| `readiness_report` | Readiness report generated |

## Related ADRs

- [ADR 0017: Shipment Architecture](../adr/0017-shipment-architecture.md)
- [ADR 0023: Warehouse Picking & Packing](../adr/0023-warehouse-picking-packing-architecture.md)
- [ADR 0024: Inventory Allocation](../adr/0024-inventory-allocation-architecture.md)
- [ADR 0025: Shipment Fulfillment & Stock Movement](../adr/0025-shipment-fulfillment-stock-movement-architecture.md)
- [ADR 0026: Warehouse Returns](../adr/0026-warehouse-returns-architecture.md)
- [ADR 0028: Multi-Warehouse](../adr/0028-multi-warehouse-architecture.md)
- [ADR 0029: Warehouse Transfer](../adr/0029-warehouse-transfer-architecture.md)
- [ADR 0030: Purchase Order Receiving](../adr/0030-purchase-order-receiving-architecture.md)
- [ADR 0031: Supplier Management](../adr/0031-supplier-management-architecture.md)
- [ADR 0032: Replenishment & Procurement Integration](../adr/0032-warehouse-replenishment-procurement-integration.md)
- [ADR 0033: Operational Integration](../adr/0033-operational-integration-warehouse-stabilization.md)
- [ADR 0034: Phase 3 Operational Readiness](../adr/0034-phase3-operational-readiness.md)

## Production Readiness Checklist

Before enabling Phase 3 in production:

1. Run `POST /api/operations/run-phase3-validation` — expect `overallStatus: READY`
2. Review `GET /api/operations/readiness-report` — all health sections `READY` or acceptable `WARNING`
3. Confirm warehouse default configuration (exactly one default warehouse per store)
4. Verify replenishment rules are enabled for critical SKUs
5. Validate RBAC: staff has `operations:read`, managers have `operations:run`
