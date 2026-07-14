/** Internal domain event type identifiers. */
export const DOMAIN_EVENT_TYPES = [
  "order.confirmed",
  "order.cancelled",
  "order.fulfilled",
  "inventory.reserved",
  "inventory.released",
  "customer.created",
  "customer.updated",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];
