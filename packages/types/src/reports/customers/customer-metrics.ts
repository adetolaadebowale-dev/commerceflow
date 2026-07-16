/** Customer metrics aggregated from immutable order and payment snapshots. */
export interface CustomerMetrics {
  readonly totalCustomers: number;
  readonly activeCustomers: number;
  readonly newCustomers: number;
  readonly returningCustomers: number;
  readonly lifetimeValue: string;
  readonly averageOrderValue: string;
  readonly ordersPerCustomer: number;
  readonly revenuePerCustomer: string;
  readonly averagePurchaseIntervalDays: number;
  readonly currency: string;
}

/** New vs returning customer breakdown for the reporting period. */
export interface CustomerNewVsReturningBreakdown {
  readonly newCustomers: number;
  readonly returningCustomers: number;
  readonly newCustomerRevenue: string;
  readonly returningCustomerRevenue: string;
}

/** Customers grouped by lifetime order count band. */
export interface CustomerPurchaseFrequencyBand {
  readonly label: string;
  readonly minOrders: number;
  readonly maxOrders?: number;
  readonly customerCount: number;
}

/** Geographic distribution row derived from customer addresses. */
export interface CustomerGeographicDistributionRow {
  readonly countryCode: string;
  readonly city?: string;
  readonly customerCount: number;
  readonly orderCount: number;
  readonly revenue: string;
}
