/** Payment provider identifiers for internal/manual processing. */
export const PAYMENT_PROVIDERS = ["internal", "manual"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
