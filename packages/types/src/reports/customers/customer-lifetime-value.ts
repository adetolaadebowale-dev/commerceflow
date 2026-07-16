/** Lifetime value metrics for a single customer profile. */
export interface CustomerLifetimeValue {
  readonly customerId: string;
  readonly grossRevenue: string;
  readonly refundTotal: string;
  readonly netLifetimeValue: string;
  readonly orderCount: number;
  readonly currency: string;
}
