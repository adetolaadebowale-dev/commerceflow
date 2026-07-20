import type { Order, Payment, PaymentStatus } from "@commerceflow/types";

import type { SalesOrderFact } from "../repositories/sales-report.repository";

const PAYMENT_STATUS_PRIORITY: Record<PaymentStatus, number> = {
  paid: 5,
  authorized: 4,
  pending: 3,
  failed: 2,
  cancelled: 1,
};

export function derivePaymentStatus(
  payments: readonly Pick<Payment, "status">[],
): string {
  if (payments.length === 0) {
    return "none";
  }

  return payments.reduce((best, payment) => {
    const bestPriority = PAYMENT_STATUS_PRIORITY[best as PaymentStatus] ?? 0;
    const nextPriority = PAYMENT_STATUS_PRIORITY[payment.status] ?? 0;
    return nextPriority > bestPriority ? payment.status : best;
  }, payments[0]!.status);
}

export function calculateUnitsSold(order: Order): number {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}

export function mapOrderToSalesOrderFact(
  order: Order,
  payments: readonly Payment[],
  warehouseId?: string,
): SalesOrderFact {
  return {
    orderId: order.id,
    storeId: order.storeId,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    paymentStatus: derivePaymentStatus(payments),
    warehouseId,
    currency: order.currency,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount ?? "0.00",
    taxAmount: order.taxAmount ?? "0.00",
    shippingAmount: order.shippingAmount ?? "0.00",
    total: order.total,
    unitsSold: calculateUnitsSold(order),
    reportTimestamp: order.confirmedAt ?? order.createdAt,
    createdAt: order.createdAt,
    confirmedAt: order.confirmedAt,
  };
}
