import type { CustomerStatus, OrderStatus } from "@commerceflow/types";

/** Read-only customer profile fact for analytics. */
export interface CustomerProfileFact {
  readonly customerId: string;
  readonly storeId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly status: CustomerStatus;
  readonly customerSince: string;
  readonly defaultCountryCode?: string;
  readonly defaultCity?: string;
}

/** Read-only order fact linked to a customer profile. */
export interface CustomerOrderFact {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly customerProfileId?: string;
  readonly storeId: string;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: string;
  readonly currency: string;
  readonly subtotal: string;
  readonly discountAmount: string;
  readonly taxAmount: string;
  readonly shippingAmount: string;
  readonly total: string;
  readonly refundTotal: string;
  readonly unitsPurchased: number;
  readonly reportTimestamp: string;
  readonly createdAt: string;
  readonly confirmedAt?: string;
}

export interface ListCustomerProfileFactsQuery {
  readonly storeId: string;
  readonly customerIds?: readonly string[];
  readonly customerStatus?: CustomerStatus;
}

export interface ListCustomerOrderFactsQuery {
  readonly storeId: string;
  readonly orderStatus?: OrderStatus;
  readonly currency?: string;
  readonly customerIds?: readonly string[];
}

export interface CustomerReportRepository {
  listCustomerProfileFacts(
    query: ListCustomerProfileFactsQuery,
  ): Promise<readonly CustomerProfileFact[]>;
  listCustomerOrderFacts(
    query: ListCustomerOrderFactsQuery,
  ): Promise<readonly CustomerOrderFact[]>;
}
