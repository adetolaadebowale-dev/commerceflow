import type { TaxRateStatus } from "./tax-rate-status";

/** Store-scoped tax rate configuration. */
export interface TaxRate {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly percentage: string;
  readonly status: TaxRateStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
