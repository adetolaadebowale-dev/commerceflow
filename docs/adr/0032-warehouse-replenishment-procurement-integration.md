# ADR 0032: Warehouse Replenishment & Procurement Integration

## Status

Accepted — Sprint 8.7

## Context

Sprint 8.6 established full supplier management. CommerceFlow must now connect inventory levels, warehouses, suppliers, and purchase orders through automated replenishment planning — identifying stock below configured reorder thresholds and generating actionable procurement recommendations without demand forecasting or external supplier communication.

## Decision

### Data model

- `ReplenishmentRule` — warehouse-specific reorder configuration per product variant with supplier assignment, reorder point/quantity, optional min/max bounds, and enable flag
- `ReplenishmentRecommendation` — generated suggestion when on-hand quantity falls below reorder point, linked to an optional draft purchase order after acceptance
- `ReplenishmentRecommendationStatus`: `pending`, `accepted`, `dismissed`
- One rule per store/warehouse/product variant (unique constraint)

### Planning rules

- Compare `quantityOnHand` from `InventoryItem` against rule `reorderPoint`
- Generate recommendations only when stock is below reorder point (missing inventory treated as zero)
- Skip generation when a pending recommendation already exists for the same warehouse/variant
- Disabled rules are excluded from generation

### Acceptance workflow

- Accepting a pending recommendation creates a **draft** purchase order or appends to an existing compatible draft PO (same store, warehouse, supplier, status `draft`)
- Line item quantities merge when the variant already exists on the draft PO
- Acceptance requires `unitCost` and `currency` (PO line requirements)
- Dismissing marks the recommendation `dismissed` without procurement side effects
- Purchase orders remain editable through the normal PO workflow — no auto-approve or auto-order

### API

**Rules**

- `POST /api/replenishment/rules`
- `GET /api/replenishment/rules`
- `GET /api/replenishment/rules/:id`
- `PATCH /api/replenishment/rules/:id`
- `DELETE /api/replenishment/rules/:id`

**Recommendations**

- `POST /api/replenishment/recommendations/generate`
- `GET /api/replenishment/recommendations`
- `GET /api/replenishment/recommendations/:id`
- `POST /api/replenishment/recommendations/:id/accept`
- `POST /api/replenishment/recommendations/:id/dismiss`

### Authorization

- `replenishment:read` — list and get rules/recommendations
- `replenishment:write` — CRUD rules, generate, accept, dismiss
- Staff: read only; manager and above: full access

### Domain events

- `replenishment-rule.created`, `.updated`, `.deleted`
- `replenishment.recommendation.generated`, `.accepted`, `.dismissed`
- `purchase-order.created` when acceptance creates a new draft PO

### Audit

- Entity `replenishment_rule`: actions `create`, `update`, `delete`
- Entity `replenishment_recommendation`: actions `generate`, `accept`, `dismiss`

## Consequences

- Procurement planning is automated from inventory signals without external forecasting
- Draft purchase orders bridge replenishment planning into the existing PO lifecycle
- Compatible draft PO consolidation reduces PO fragmentation for the same supplier/warehouse
- Future sprints can add cost defaults, multi-supplier rules, or scheduled generation jobs
