import type { Order, Payment, PaymentStatus } from "@commerceflow/types";

const PAYMENT_STATUS_PRIORITY: Record<PaymentStatus, number> = {
  paid: 5,
  authorized: 4,
  pending: 3,
  failed: 2,
  cancelled: 1,
};

export function derivePaymentStatus(payments: readonly Payment[]): string {
  if (payments.length === 0) {
    return "none";
  }

  return payments.reduce((best, payment) => {
    const bestPriority = PAYMENT_STATUS_PRIORITY[best as PaymentStatus] ?? 0;
    const nextPriority = PAYMENT_STATUS_PRIORITY[payment.status] ?? 0;
    return nextPriority > bestPriority ? payment.status : best;
  }, payments[0]!.status);
}

export function calculateUnitsPurchased(order: Order): number {
  return order.items.reduce((total, item) => total + item.quantity, 0);
}
