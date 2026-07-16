/** Financial metrics aggregated from immutable order snapshots. */
export interface SalesFinancialMetrics {
  readonly grossSales: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shipping: string;
  readonly netSales: string;
  readonly averageOrderValue: string;
  readonly orderCount: number;
  readonly unitsSold: number;
  readonly currency: string;
}

/** Metrics grouped by calendar period in the report timezone. */
export interface SalesPeriodBreakdown {
  readonly periodLabel: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly orderCount: number;
  readonly grossSales: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shipping: string;
  readonly netSales: string;
  readonly unitsSold: number;
}

/** Metrics grouped by order or payment status. */
export interface SalesStatusBreakdown {
  readonly status: string;
  readonly orderCount: number;
  readonly grossSales: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shipping: string;
  readonly netSales: string;
  readonly unitsSold: number;
}

/** Metrics grouped by warehouse when shipment data exists. */
export interface SalesWarehouseBreakdown {
  readonly warehouseId: string;
  readonly orderCount: number;
  readonly grossSales: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shipping: string;
  readonly netSales: string;
  readonly unitsSold: number;
}
