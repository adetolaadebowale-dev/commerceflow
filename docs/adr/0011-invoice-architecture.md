# ADR 0011: Invoice Architecture

## Status

Accepted

## Date

2026-07-15

## Context

CommerceFlow separates commercial operations into distinct domains:

- **Orders** — commercial intent and fulfillment lifecycle
- **Payments** — settlement and provider interactions
- **Invoices** — financial documents for billing and reconciliation

Sprint 6.6 introduces invoices as store-scoped financial documents linked to orders, independent from payment lifecycle. PDF generation, email delivery, tax calculation, and accounting integrations are deferred.

## Decision

### Order vs Payment vs Invoice

| Domain | Purpose | Lifecycle |
|--------|---------|-----------|
| Order | What was purchased | draft → confirmed → fulfilled/cancelled |
| Payment | How money moves | pending → authorized → paid/failed/cancelled |
| Invoice | What is billed | draft → issued → paid/void |

An order may have one invoice (Sprint 6.6) and multiple payments (future partial payments). Invoice and payment lifecycles do not automatically sync.

### Invoice model

| Field | Purpose |
|-------|---------|
| `storeId` | Tenant boundary |
| `orderId` | FK → Order (unique per store for Sprint 6.6) |
| `invoiceNumber` | Unique per store (`INV-{date}-{suffix}`) |
| `subtotal` / `currency` | Snapshotted from order at creation |
| `status` | Financial document lifecycle |
| `issuedAt` / `dueAt` / `paidAt` | Lifecycle timestamps |

### Financial document lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Created, editable window before issue |
| `issued` | Sent/finalized — financial fields immutable |
| `paid` | Invoice settled |
| `void` | Invoice cancelled |

**Allowed transitions:**

| From | To |
|------|-----|
| `draft` | `issued`, `void` |
| `issued` | `paid`, `void` |
| `paid`, `void` | *(terminal)* |

After `issued`, subtotal, currency, and invoice number cannot change — only lifecycle transitions are permitted.

### API surface

| Method | Path | Permission |
|--------|------|------------|
| POST | `/api/orders/:id/invoices` | `invoices:write` |
| GET | `/api/orders/:id/invoices` | `invoices:read` |
| GET | `/api/invoices/:id` | `invoices:read` |
| POST | `/api/invoices/:id/issue` | `invoices:lifecycle` |
| POST | `/api/invoices/:id/mark-paid` | `invoices:lifecycle` |
| POST | `/api/invoices/:id/void` | `invoices:lifecycle` |

### Domain events

- `invoice.created`
- `invoice.issued`
- `invoice.paid`
- `invoice.voided`

### Audit logging

Entity type `invoice` with actions: `create`, `issue`, `mark_paid`, `void`.

### Future PDF generation

Invoice records provide the data source for PDF templates. A future document service will render PDFs from issued invoice snapshots without mutating invoice records.

### Future tax support

Tax lines, rates, and jurisdictional rules will extend the invoice model or introduce `InvoiceLine` / `InvoiceTax` aggregates. Sprint 6.6 stores order subtotal only — no tax fields.

### Future accounting integrations

Issued/paid invoice events will feed accounting export adapters (QuickBooks, Xero, etc.) via domain event handlers, keeping the core invoice service provider-agnostic.

## Consequences

### Positive

- Clear separation of billing documents from orders and payments
- Immutable financial snapshot after issue
- Unique invoice numbers per store with collision retry
- One invoice per order constraint enforced at DB level

### Negative / trade-offs

- Invoice paid status is manual — not auto-synced from payment.paid
- No line-item detail on invoice (uses order subtotal header only)
- No PDF/email in this sprint
- `void` status string (not `voided`) aligns with Prisma enum

## References

- ADR 0009: Payment Foundation
- ADR 0008: Checkout Architecture
- Sprint 4.0: Order Foundation
