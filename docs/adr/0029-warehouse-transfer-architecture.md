# ADR 0029: Warehouse Transfer Architecture

## Status

Accepted — Sprint 8.4

## Context

Sprint 8.3 introduced multi-warehouse inventory with warehouse-scoped `InventoryItem` records and reserved `StockMovementType.transfer` for future inter-warehouse logistics. CommerceFlow must now support internal warehouse transfers that move stock between locations without affecting customer-facing orders, reservations, or shipments.

## Decision

### Data model

- `WarehouseTransfer` aggregate with lifecycle status: `draft`, `approved`, `in_transit`, `received`, `cancelled`
- `WarehouseTransferItem` lines reference source `inventoryItemId` and `quantity`
- Transfer numbers use format `XFR-YYYYMMDD-XXXXXXXX`
- Stock movements use existing `movementType: transfer` with metadata linking `warehouseTransferId`, direction (`outbound` / `inbound`), and warehouse ids

### Lifecycle

| Status | Transition | Inventory effect |
|--------|------------|----------------|
| `draft` | create | none |
| `approved` | approve | validates sufficient source stock; no deduction |
| `in_transit` | ship | deducts source warehouse; outbound transfer movement |
| `received` | receive | adds to destination warehouse; inbound transfer movement |
| `cancelled` | cancel from `draft` or `approved` | none |

### Business rules

- Source and destination warehouses must differ and belong to the same store
- Both warehouses must be `active`
- Transfer items must reference inventory in the source warehouse
- Inventory is not deducted until **ship**
- Receive creates destination `InventoryItem` when missing for the product variant
- All stock movements are immutable ledger entries within repository transactions
- Transfers are store-scoped with tenant isolation on all queries

### API

- `POST /api/warehouse-transfers` — create draft transfer
- `GET /api/warehouse-transfers` — list transfers
- `GET /api/warehouse-transfers/:id` — get transfer
- `POST /api/warehouse-transfers/:id/approve`
- `POST /api/warehouse-transfers/:id/ship`
- `POST /api/warehouse-transfers/:id/receive`
- `POST /api/warehouse-transfers/:id/cancel`

### Authorization

- `warehouse-transfers:read` — list and get
- `warehouse-transfers:write` — create
- `warehouse-transfers:lifecycle` — approve, ship, receive, cancel
- Staff: read only; manager and above: full access

### Domain events

- `warehouse-transfer.created`, `.approved`, `.shipped`, `.received`, `.cancelled`
- `stock-movement.created` for each outbound (ship) and inbound (receive) movement

### Audit

- Entity: `warehouse_transfer`
- Actions: `create`, `approve`, `ship`, `receive`, `cancel`

## Consequences

- Internal logistics are isolated from order fulfillment and reservation flows
- Multi-warehouse reporting can trace inter-location moves via transfer stock movements
- Approved-but-unshipped transfers reserve no stock automatically; approve validates availability at approval time and ship re-validates at deduction time
- Destination inventory records are created on receive when the variant has no existing record at the destination warehouse
