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
] as const;

export type DomainAggregateType = (typeof DOMAIN_AGGREGATE_TYPES)[number];
