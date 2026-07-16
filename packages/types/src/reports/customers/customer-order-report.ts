import type { OrderStatus } from "../../orders/order-status";
import type { ReportFilter, ReportPagination } from "../report-foundation";

/** Single order row in the customer order history report. */
export interface CustomerOrderReport {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly customerId?: string;
  readonly customerEmail?: string;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: string;
  readonly currency: string;
  readonly grossSales: string;
  readonly discounts: string;
  readonly taxes: string;
  readonly shipping: string;
  readonly netSales: string;
  readonly refundTotal: string;
  readonly unitsPurchased: number;
  readonly confirmedAt?: string;
  readonly createdAt: string;
}

/** Paginated customer order history report. */
export interface CustomerOrdersReport {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly filter: ReportFilter;
  readonly items: readonly CustomerOrderReport[];
  readonly pagination: ReportPagination;
}
