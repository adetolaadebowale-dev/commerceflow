import type { ReportFilter, ReportPagination } from "../report-foundation";
import type { CustomerLifetimeValue } from "./customer-lifetime-value";

/** Top customer row ranked by lifetime value or revenue. */
export interface TopCustomerReport {
  readonly customerId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly customerSince: string;
  readonly lifetimeValue: CustomerLifetimeValue;
  readonly averageOrderValue: string;
  readonly averagePurchaseIntervalDays?: number;
  readonly lastOrderAt?: string;
}

/** Paginated top customers report. */
export interface TopCustomersReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly items: readonly TopCustomerReport[];
  readonly pagination: ReportPagination;
}
