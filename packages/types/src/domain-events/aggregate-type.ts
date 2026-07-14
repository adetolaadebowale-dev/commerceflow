/** Aggregate roots referenced by domain events. */
export const DOMAIN_AGGREGATE_TYPES = ["order", "inventory_reservation"] as const;

export type DomainAggregateType = (typeof DOMAIN_AGGREGATE_TYPES)[number];
