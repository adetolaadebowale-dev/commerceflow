export const TAX_RATE_STATUSES = ["active", "inactive"] as const;

export type TaxRateStatus = (typeof TAX_RATE_STATUSES)[number];
