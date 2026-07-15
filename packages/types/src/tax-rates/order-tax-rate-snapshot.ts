/** Immutable tax rate snapshot captured on an order or invoice at checkout. */
export interface OrderTaxRateSnapshot {
  readonly taxRateId: string;
  readonly nameSnapshot: string;
  readonly percentageSnapshot: string;
}
