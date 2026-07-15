/** Internal domain event type identifiers. */
export const DOMAIN_EVENT_TYPES = [
  "order.confirmed",
  "order.cancelled",
  "order.fulfilled",
  "inventory.reserved",
  "inventory.released",
  "customer.created",
  "customer.updated",
  "customer.address.created",
  "customer.address.updated",
  "cart.created",
  "cart.item.added",
  "cart.item.updated",
  "cart.item.removed",
  "checkout.completed",
  "payment.created",
  "payment.authorized",
  "payment.paid",
  "payment.failed",
  "payment.cancelled",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];
