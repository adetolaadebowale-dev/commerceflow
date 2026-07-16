import type { OrderStatus } from "../../orders/order-status";
import type { ReportFilter, ReportPagination } from "../report-foundation";

/** Single order row in the sales orders report. */
export interface SalesOrderReport {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly storeId: string;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: string;
  readonly warehouseId?: string;
  readonly currency: string;
  readonly grossSales: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shipping: string;
  readonly netSales: string;
  readonly unitsSold: number;
  readonly confirmedAt?: string;
  readonly createdAt: string;
}

/** Paginated sales orders report. */
export interface SalesOrdersReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly items: readonly SalesOrderReport[];
  readonly pagination: ReportPagination;
}
