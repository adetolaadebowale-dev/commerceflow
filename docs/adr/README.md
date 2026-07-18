# Architecture Decision Records

ADRs document significant technical decisions for CommerceFlow.

Numbering is sequential from **0001** through **0061** with no gaps.

## Index

| ADR | Title |
|-----|-------|
| [0001](0001-monorepo-architecture.md) | Monorepo Architecture |
| [0002](0002-store-authorization-and-permission-model.md) | Store Authorization and Permission Model |
| [0003](0003-audit-logging-foundation.md) | Audit Logging Foundation |
| [0004](0004-domain-events-foundation.md) | Domain Events Foundation |
| [0005](0005-customer-accounts-foundation.md) | Customer Accounts Foundation |
| [0006](0006-customer-address-aggregate.md) | Customer Address Aggregate |
| [0007](0007-shopping-cart-foundation.md) | Shopping Cart Aggregate |
| [0008](0008-checkout-architecture.md) | Checkout Architecture |
| [0009](0009-payment-foundation.md) | Payment Foundation |
| [0010](0010-payment-gateway-architecture.md) | Payment Gateway Architecture |
| [0011](0011-invoice-architecture.md) | Invoice Architecture |
| [0012](0012-refund-architecture.md) | Refund Architecture |
| [0013](0013-promotion-architecture.md) | Promotion Architecture |
| [0014](0014-promotion-redemption-architecture.md) | Promotion Redemption Architecture |
| [0015](0015-financial-totals-model.md) | Financial Totals Model |
| [0016](0016-tax-foundation.md) | Tax Foundation |
| [0017](0017-shipment-architecture.md) | Shipment Architecture |
| [0018](0018-shipment-carrier-gateway-architecture.md) | Shipment Carrier Gateway Architecture |
| [0019](0019-shipment-tracking-timeline-architecture.md) | Shipment Tracking Timeline Architecture |
| [0020](0020-shipping-configuration-architecture.md) | Shipping Configuration Architecture |
| [0021](0021-checkout-shipping-selection-architecture.md) | Checkout Shipping Selection Architecture |
| [0022](0022-shipment-package-architecture.md) | Shipment Package Architecture |
| [0023](0023-warehouse-picking-packing-architecture.md) | Warehouse Picking & Packing Architecture |
| [0024](0024-inventory-allocation-architecture.md) | Warehouse Inventory Allocation Architecture |
| [0025](0025-shipment-fulfillment-stock-movement-architecture.md) | Shipment Fulfillment & Stock Movement Architecture |
| [0026](0026-warehouse-returns-architecture.md) | Warehouse Returns Architecture |
| [0027](0027-inventory-adjustments-cycle-count-architecture.md) | Inventory Adjustments & Cycle Count Architecture |
| [0028](0028-multi-warehouse-architecture.md) | Multi-Warehouse Architecture |
| [0029](0029-warehouse-transfer-architecture.md) | Warehouse Transfer Architecture |
| [0030](0030-purchase-order-receiving-architecture.md) | Purchase Order & Receiving Architecture |
| [0031](0031-supplier-management-architecture.md) | Supplier Management Architecture |
| [0032](0032-warehouse-replenishment-procurement-integration.md) | Warehouse Replenishment & Procurement Integration |
| [0033](0033-operational-integration-warehouse-stabilization.md) | Operational Integration & Warehouse Stabilization |
| [0034](0034-phase3-operational-readiness.md) | Phase 3 Operational Readiness |
| [0035](0035-reporting-foundation.md) | Reporting Foundation |
| [0036](0036-sales-reporting-architecture.md) | Sales Reporting Architecture |
| [0037](0037-inventory-reporting-architecture.md) | Inventory Reporting Architecture |
| [0038](0038-customer-analytics-architecture.md) | Customer Analytics Architecture |
| [0039](0039-financial-reporting-architecture.md) | Financial Reporting Architecture |
| [0040](0040-procurement-warehouse-analytics-architecture.md) | Procurement & Warehouse Analytics Architecture |
| [0041](0041-executive-dashboard-architecture.md) | Executive Dashboard Architecture |
| [0042](0042-notification-infrastructure-foundation.md) | Notification Infrastructure Foundation |
| [0043](0043-email-notification-foundation.md) | Email Notification Foundation |
| [0044](0044-sms-notification-foundation.md) | SMS Notification Foundation |
| [0045](0045-in-app-notification-center.md) | In-App Notification Center |
| [0046](0046-background-job-foundation.md) | Background Job Foundation |
| [0047](0047-domain-notification-integration.md) | Domain Notification Integration |
| [0048](0048-notification-preferences-foundation.md) | Notification Preferences Foundation |
| [0049](0049-organization-administration-foundation.md) | Organization Administration Foundation |
| [0050](0050-store-administration-configuration.md) | Store Administration & Configuration |
| [0051](0051-data-import-export-foundation.md) | Data Import & Export Foundation |
| [0052](0052-public-api-api-keys-foundation.md) | Public API & API Keys Foundation |
| [0053](0053-webhooks-foundation.md) | Webhooks Foundation |
| [0054](0054-feature-flags-foundation.md) | Feature Flags Foundation |
| [0055](0055-platform-operations-foundation.md) | Platform Operations & Maintenance Foundation |
| [0056](0056-security-performance-hardening-foundation.md) | Security & Performance Hardening Foundation |
| [0057](0057-database-optimization-query-performance.md) | Database Optimization & Query Performance |
| [0058](0058-observability-structured-logging.md) | Observability & Structured Logging |
| [0059](0059-backup-recovery-disaster-readiness.md) | Backup, Recovery & Disaster Readiness |
| [0060](0060-load-testing-scalability-foundation.md) | Load Testing & Scalability Foundation |
| [0061](0061-deployment-release-readiness.md) | Deployment & Release Readiness |

## Conventions

- Title format: `# ADR NNNN: Title`
- Sections: Status, Date, Context, Decision, Consequences
- Cross-links use relative paths within `docs/`
