# ADR 0031: Supplier Management Architecture

## Status

Accepted — Sprint 8.6

## Context

Sprint 8.5 introduced a minimal `Supplier` reference entity to validate purchase order creation. CommerceFlow now requires a full supplier management domain with contacts, payment terms, procurement metadata, and REST APIs while preserving purchase order integration and historical data integrity.

## Decision

### Data model

- `Supplier` — store-scoped aggregate with `code`, `name`, contact details, `paymentTerm`, `currency`, `status`, and `notes`
- `SupplierContact` — contact persons linked to a supplier with optional `role` and `isPrimary` flag
- `PaymentTerm` enum: `immediate`, `net7`, `net15`, `net30`, `net60`, `custom`
- `SupplierStatus` enum: `active`, `inactive`
- Soft delete via `deletedAt`; deleted suppliers are excluded from lookups

### Business rules

- Supplier `code` is unique per store
- Exactly one primary contact per supplier when `isPrimary` is set (previous primaries are unset in a transaction)
- Purchase orders require an `active`, non-deleted supplier at creation time
- Inactive or soft-deleted suppliers cannot receive new purchase orders
- Existing purchase orders remain valid and reference `supplierId` unchanged
- All queries enforce store-scoped tenant isolation

### API

- `POST /api/suppliers` — create supplier
- `GET /api/suppliers` — list suppliers (paginated, filterable by status/search)
- `GET /api/suppliers/:id` — get supplier with contacts
- `PATCH /api/suppliers/:id` — update supplier
- `DELETE /api/suppliers/:id` — soft delete supplier
- `POST /api/suppliers/:id/contacts` — add contact
- `PATCH /api/supplier-contacts/:id` — update contact
- `DELETE /api/supplier-contacts/:id` — delete contact

### Module structure

- `apps/api/src/suppliers/` — repositories (interface, Prisma, memory), services, routes, errors, testing
- Purchase order module imports `getSupplierRepository()` from `@/suppliers/repositories`

### Authorization

- `suppliers:read` — list and get
- `suppliers:write` — create, update, delete, contact management
- Staff: read only; manager and above: full access

### Domain events

- `supplier.created`, `supplier.updated`, `supplier.deleted`
- `supplier.contact.created`, `supplier.contact.updated`, `supplier.contact.deleted`

### Audit

- Entity `supplier`: actions `create`, `update`, `delete`
- Entity `supplier_contact`: actions `create`, `update`, `delete`

## Consequences

- Suppliers are first-class procurement entities with full CRUD and contact management
- Purchase orders continue using `supplierId` without schema changes
- Supplier soft delete preserves referential integrity for historical purchase orders
- Performance metrics and procurement relationships can extend this foundation in future sprints
