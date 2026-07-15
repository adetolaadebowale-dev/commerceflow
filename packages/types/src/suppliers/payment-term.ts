/** Supplier payment term options. */
export const PAYMENT_TERMS = [
  "immediate",
  "net7",
  "net15",
  "net30",
  "net60",
  "custom",
] as const;

export type PaymentTerm = (typeof PAYMENT_TERMS)[number];
