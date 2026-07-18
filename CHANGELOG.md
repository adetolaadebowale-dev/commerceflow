# Changelog

All notable releases of CommerceFlow are documented in this file.

## v1.0.0 — 2026-07-17

Backend v1.0 release. CommerceFlow ships as a modular-monolith API with shared TypeScript packages, store-scoped authorization, audit logging, and domain events across the commerce lifecycle.

### Commerce Core

- Identity, sessions, and store-scoped RBAC
- Organizations, stores, and catalogue (products, categories, brands)
- Inventory items, stock movements, and reservations
- Customers, addresses, shopping carts, and checkout
- Orders with confirm / cancel / fulfill lifecycle

### Financial Operations

- Payments and payment gateway abstraction
- Invoices and refunds
- Promotions and redemptions
- Tax rates and financial totals model

### Shipping & Fulfillment

- Shipping zones/methods and checkout shipping selection
- Shipments, packages, carrier gateway, and tracking timeline
- Warehouses, transfers, purchase orders, and suppliers
- Pick lists, inventory allocations, replenishment
- Returns, inventory adjustments, and cycle counts
- Phase 3 operational readiness / integrity checks

### Reporting & Analytics

- Sales, inventory, customer, financial, and procurement reports
- Executive dashboard and KPI aggregation

### Notifications

- Notification infrastructure with email, SMS, and in-app channels
- Background jobs and domain notification integration
- Per-user notification preferences

### Enterprise Platform

- Organization and store administration
- Data import/export
- Public API keys and webhooks
- Feature flags
- Platform operations (health, maintenance, diagnostics)

### Production Hardening

- Security and performance hardening controls
- Database optimization diagnostics
- Observability and structured logging
- Backup / recovery disaster readiness
- Load testing and scalability baselines
- Deployment and release readiness diagnostics

### Release packaging (Sprint 12.6)

- Root `.env.example` for production-oriented configuration
- Deployment guide and migration verification notes
- README refreshed for v1.0 operator onboarding
