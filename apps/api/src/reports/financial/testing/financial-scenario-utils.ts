import type { Invoice, Order, OrderItem, OrderStatus, Payment } from "@commerceflow/types";

import type { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import type { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import type { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import type { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";

export interface SeedFinancialOrderInput {
  readonly id?: string;
  readonly storeId: string;
  readonly status?: OrderStatus;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly taxAmount?: string;
  readonly shippingAmount?: string;
  readonly total: string;
  readonly currency?: string;
  readonly confirmedAt?: string;
  readonly createdAt?: string;
  readonly paymentStatus?: Payment["status"];
  readonly refundAmount?: string;
  readonly invoiceStatus?: Invoice["status"];
  readonly invoiceTotal?: string;
}

export async function seedFinancialScenario(
  module: {
    orderRepository: MemoryOrderRepository;
    paymentRepository: MemoryPaymentRepository;
    invoiceRepository: MemoryInvoiceRepository;
    refundRepository: MemoryRefundRepository;
  },
  orders: readonly SeedFinancialOrderInput[],
) {
  const seededOrders: Order[] = [];

  for (const input of orders) {
    const now = input.createdAt ?? new Date().toISOString();
    const orderId = input.id ?? crypto.randomUUID();
    const item: OrderItem = {
      id: crypto.randomUUID(),
      orderId,
      productVariantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: input.subtotal,
      currency: input.currency ?? "USD",
      quantity: 1,
      lineSubtotal: input.subtotal,
      createdAt: now,
    };
    const order: Order = {
      id: orderId,
      storeId: input.storeId,
      orderNumber: `ORD-${orderId.slice(0, 8)}`,
      status: input.status ?? "confirmed",
      subtotal: input.subtotal,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      shippingAmount: input.shippingAmount,
      total: input.total,
      currency: input.currency ?? "USD",
      items: [item],
      confirmedAt: input.confirmedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };

    module.orderRepository.seedOrder(order);
    seededOrders.push(order);

    let payment: Payment | undefined;

    if (input.paymentStatus) {
      payment = await module.paymentRepository.create({
        storeId: input.storeId,
        orderId,
        amount: input.total,
        currency: input.currency ?? "USD",
        provider: "internal",
        reference: `PAY-${orderId.slice(0, 8)}`,
      });

      if (input.paymentStatus !== "pending") {
        payment = await module.paymentRepository.transitionStatus(
          input.storeId,
          payment.id,
          {
            fromStatus: "pending",
            toStatus: input.paymentStatus,
          },
        );
      }

      if (input.refundAmount) {
        const refund = await module.refundRepository.create({
          storeId: input.storeId,
          paymentId: payment.id,
          amount: input.refundAmount,
          currency: input.currency ?? "USD",
          reason: "Test refund",
        });

        await module.refundRepository.transitionStatus(input.storeId, refund.id, {
          fromStatus: "pending",
          toStatus: "completed",
        });
      }
    }

    if (input.invoiceStatus) {
      const invoiceNow = now;
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        storeId: input.storeId,
        orderId,
        invoiceNumber: `INV-${orderId.slice(0, 8)}`,
        status: input.invoiceStatus,
        subtotal: input.subtotal,
        discountAmount: input.discountAmount,
        taxAmount: input.taxAmount,
        shippingAmount: input.shippingAmount,
        total: input.invoiceTotal ?? input.total,
        currency: input.currency ?? "USD",
        issuedAt:
          input.invoiceStatus === "issued" || input.invoiceStatus === "paid"
            ? invoiceNow
            : undefined,
        paidAt: input.invoiceStatus === "paid" ? invoiceNow : undefined,
        createdAt: invoiceNow,
        updatedAt: invoiceNow,
      };

      module.invoiceRepository.seedInvoice(invoice);
    }
  }

  return seededOrders;
}
