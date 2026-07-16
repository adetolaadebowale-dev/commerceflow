import type { CustomerOrderReport } from "@commerceflow/types";

import type { CustomerOrderFact } from "../repositories/customer-report.repository";
import { netOrderTotal } from "../services/customer-aggregation";

export function mapCustomerOrderFactToReport(
  fact: CustomerOrderFact,
  customerEmail?: string,
): CustomerOrderReport {
  return {
    orderId: fact.orderId,
    orderNumber: fact.orderNumber,
    customerId: fact.customerProfileId,
    customerEmail,
    orderStatus: fact.orderStatus,
    paymentStatus: fact.paymentStatus,
    currency: fact.currency,
    grossSales: fact.subtotal,
    discounts: fact.discountAmount,
    taxes: fact.taxAmount,
    shipping: fact.shippingAmount,
    netSales: netOrderTotal(fact),
    refundTotal: fact.refundTotal,
    unitsPurchased: fact.unitsPurchased,
    confirmedAt: fact.confirmedAt,
    createdAt: fact.createdAt,
  };
}
