# ADR 0030: Purchase Order & Receiving Architecture

## Status

Accepted — Sprint 8.5

## Context

Sprint 8.4 introduced internal warehouse transfers. CommerceFlow must now support **supplier procurement** with purchase orders that receive inbound inventory into warehouses while remaining independent from customer orders, reservations, and shipments.

## Decision

### Data model

- `Supplier` — minimal store-scoped reference entity (`name`, `code`, `status`) for procurement validation
- `PurchaseOrder` aggregate with lifecycle status: `draft`, `approved`, `ordered`, `partially_received`, `received`, `cancelled`
- `PurchaseOrderItem` lines reference `productVariantId`, `quantityOrdered`, `quantityReceived`, `unitCost`, and `currency`
- Purchase order numbers use format `PO-YYYYMMDD-XXXXXXXX`

### Lifecycle

| Status | Transition | Inventory effect |
|--------|------------|------------------|
| `draft` | create | none |
| `approved` | approve | none |
| `ordered` | order (approved only) | none |
| `partially_received` | receive partial | increases warehouse inventory |
| `received` | receive remaining | increases warehouse inventory |
| `cancelled` | cancel from `draft` or `approved` | none |

### Receiving rules

- Only `ordered` or `partially_received` purchase orders may receive inventory
- Partial receiving is supported; `quantityReceived` accumulates per line item
- Cannot receive more than the remaining ordered quantity per line
- Fully received lines reject further receipts
- Receiving creates `StockMovement(type=adjustment)` with `purchase_order_receipt` metadata (extensible to a dedicated procurement movement type later)
- Creates destination `InventoryItem` automatically when the variant has no record at the target warehouse

### Business rules

- Warehouse and supplier must exist, belong to the store, and be `active`
- Product variants must exist in the store catalogue
- All stock changes occur in repository transactions with rollback on failure
- Store-scoped tenant isolation on all queries

### API

- `POST /api/purchase-orders` — create draft purchase order
- `GET /api/purchase-orders` — list purchase orders
- `GET /api/purchase-orders/:id` — get purchase order
- `POST /api/purchase-orders/:id/approve`
- `POST /api/purchase-orders/:id/order`
- `POST /api/purchase-orders/:id/receive` — partial or full receipt with line quantities
- `POST /api/purchase-orders/:id/cancel`

### Authorization

- `purchase-orders:read` — list and get
- `purchase-orders:write` — create
- `purchase-orders:lifecycle` — approve, order, receive, cancel
- Staff: read only; manager and above: full access

### Domain events

- `purchase-order.created`, `.approved`, `.ordered`, `.received`, `.cancelled`
- `stock-movement.created` for each receipt movement

### Audit

- Entity: `purchase_order`
- Actions: `create`, `approve`, `order`, `receive`, `cancel`

## Consequences

- Procurement is isolated from customer-facing order and fulfillment flows
- Supplier management is reference-only in this sprint; a dedicated supplier API can follow
- Receipt stock movements use `adjustment` type with procurement metadata until a dedicated movement type is introduced
- Partial receiving enables incremental warehouse intake without splitting purchase orders
