/** Entity types referenced by immutable audit log entries. */
export const AUDIT_ENTITY_TYPES = [
  "brand",
  "category",
  "product",
  "inventory_item",
  "stock_movement",
  "order",
  "inventory_reservation",
  "customer",
  "customer_address",
  "cart",
  "cart_item",
  "checkout",
  "payment",
  "invoice",
  "refund",
  "promotion",
  "promotion_redemption",
  "tax_rate",
  "shipment",
  "shipment_tracking_event",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];
