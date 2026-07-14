/** Lifecycle status for a store-scoped customer profile. */
export const CUSTOMER_STATUSES = ["active", "inactive"] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
