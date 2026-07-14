# ADR 0006: Customer Address Aggregate

## Status

Accepted

## Date

2026-07-15

## Context

Sprint 6.0 introduced the store-scoped `Customer` aggregate for merchant-managed customer profiles. Checkout, fulfillment, and invoicing all require postal addresses, but addresses are not authentication credentials or order line items — they are reusable contact and delivery details owned by a customer profile.

Sprint 6.1 adds customer address management as a child entity of the Customer aggregate.

## Decision

### CustomerAddress entity

A dedicated `CustomerAddress` Prisma model and `@commerceflow/types` contract represent store-scoped postal addresses:

| Field | Purpose |
|-------|---------|
| `id` | Primary key |
| `customerId` | FK → `Customer`; address belongs to exactly one customer |
| `storeId` | Tenant boundary (denormalized for store-scoped queries) |
| `label` | Human-readable label (Home, Work, etc.) |
| `recipientName` | Delivery recipient |
| `phone` | Optional contact number |
| `addressLine1`, `addressLine2` | Street address lines |
| `city`, `stateProvince`, `postalCode` | Locality fields |
| `countryCode` | ISO 3166-1 alpha-2 country code |
| `isDefault` | Whether this is the customer's default address |
| `createdAt`, `updatedAt` | Audit timestamps |
| `deletedAt` | Soft delete |

### Addresses belong to Customer, not Order

Customer addresses are modeled as children of the `Customer` aggregate rather than as fields on `Order` or as a standalone top-level aggregate.

**Rationale:**

1. **Lifecycle ownership.** Addresses are created, updated, and deleted as part of a customer's profile. They outlive any single order and may be reused across many orders.
2. **Single default invariant.** "One default address per customer" is a customer-profile rule, not an order rule. Enforcing it on the Customer aggregate keeps the invariant local and testable.
3. **Tenant isolation.** Store-scoped addresses with a `customerId` FK prevent cross-customer and cross-store leakage.
4. **Separation from order immutability.** Orders must capture the address *as it was at checkout time*. If orders referenced mutable `CustomerAddress` rows directly, a customer editing their home address after purchase would retroactively change historical order records.

### Future order address snapshotting

When checkout and shipping are implemented, orders will **snapshot** address data at placement time rather than hold a live FK to `CustomerAddress`:

```
Order
  └── shippingAddressSnapshot (embedded value object)
        recipientName, addressLine1, city, ...
        sourceCustomerAddressId? (optional traceability only)
```

The snapshot preserves fulfillment and compliance history even if the customer later edits or deletes the source address. `sourceCustomerAddressId` is optional metadata for support workflows — not a join used for display of fulfilled orders.

This mirrors the existing `OrderItem` product snapshot pattern from Sprint 4.0.

### Business rules

- Each customer may have multiple active addresses.
- Only one default address per customer (partial unique index where `deleted_at IS NULL` and `is_default = true`).
- First address created for a customer is automatically set as default.
- Setting a new default clears the previous default in the same transaction.
- Soft-deleting the default address promotes the next remaining address to default when one exists.
- Soft delete is supported at the service/repository layer; no public DELETE endpoint in Sprint 6.1.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/customers/:id/addresses` | `customers:write` |
| GET | `/api/customers/:id/addresses` | `customers:read` |
| GET | `/api/customer-addresses/:id` | `customers:read` |
| PATCH | `/api/customer-addresses/:id` | `customers:write` |

Nested collection routes use the parent customer id; single-address routes use `/api/customer-addresses/:id` for direct access without requiring the customer id in the path.

### Cross-cutting concerns

- **Domain events:** `customer.address.created`, `customer.address.updated` emitted from `CustomerAddressService` after successful mutations.
- **Audit logging:** `customer_address` entity type; create/update recorded at route boundary.
- **RBAC:** Reuses `customers:read` and `customers:write` from Sprint 6.0.

### Explicitly out of scope (Sprint 6.1)

- Shipping rate calculation
- Tax jurisdiction resolution
- Geocoding
- External address validation (USPS, Google, etc.)

## Consequences

### Positive

- Clear aggregate boundary: Customer owns reusable addresses; Order will own immutable snapshots.
- Default-address invariant enforced in repository transactions.
- Consistent with established CommerceFlow patterns (repository, service, route, events, audit, RBAC).
- API client and validation shared across apps.

### Negative / trade-offs

- `storeId` is denormalized on `CustomerAddress` for tenant-scoped queries (acceptable for read performance and isolation checks).
- Orders cannot yet reference customer addresses; snapshot integration deferred to a future checkout sprint.
- No DELETE endpoint; soft delete is internal-only until a future sprint defines merchant UX for address removal.

## References

- ADR 0005: Customer Accounts Foundation
- ADR 0004: Domain Events Foundation
- ADR 0003: Audit Logging Foundation
- Sprint 4.0: Order item product snapshot pattern
