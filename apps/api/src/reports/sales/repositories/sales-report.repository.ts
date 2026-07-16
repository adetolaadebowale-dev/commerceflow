import type { OrderStatus } from "@commerceflow/types";

/** Read-only sales fact derived from immutable order snapshots. */
export interface SalesOrderFact {
  readonly orderId: string;
  readonly storeId: string;
  readonly orderNumber: string;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: string;
  readonly warehouseId?: string;
  readonly currency: string;
  readonly subtotal: string;
  readonly discountAmount: string;
  readonly taxAmount: string;
  readonly shippingAmount: string;
  readonly total: string;
  readonly unitsSold: number;
  readonly reportTimestamp: string;
  readonly createdAt: string;
  readonly confirmedAt?: string;
}

export interface ListSalesOrderFactsQuery {
  readonly storeId: string;
  readonly orderStatus?: OrderStatus;
  readonly currency?: string;
}

export interface SalesReportRepository {
  listOrderFacts(
    query: ListSalesOrderFactsQuery,
  ): Promise<readonly SalesOrderFact[]>;
}
