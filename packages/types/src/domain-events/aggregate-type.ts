/** Aggregate roots referenced by domain events. */
export const DOMAIN_AGGREGATE_TYPES = [
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
  "tax_rate",
  "shipment",
  "shipment_package",
  "pick_list",
  "inventory_allocation",
  "stock_movement",
  "return",
  "shipping_zone",
  "shipping_method",
] as const;

export type DomainAggregateType = (typeof DOMAIN_AGGREGATE_TYPES)[number];
