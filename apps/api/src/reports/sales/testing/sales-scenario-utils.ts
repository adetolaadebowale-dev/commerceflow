import type { Order, OrderItem, OrderStatus, Payment, Shipment } from "@commerceflow/types";

import type { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import type { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import type { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";

export interface SeedSalesOrderInput {
  readonly id?: string;
  readonly storeId: string;
  readonly orderNumber?: string;
  readonly status?: OrderStatus;
  readonly subtotal: string;
  readonly discountAmount?: string;
  readonly taxAmount?: string;
  readonly shippingAmount?: string;
  readonly total: string;
  readonly currency?: string;
  readonly quantity?: number;
  readonly confirmedAt?: string;
  readonly createdAt?: string;
  readonly warehouseId?: string;
  readonly paymentStatus?: Payment["status"];
}

export async function seedSalesScenario(
  module: {
    orderRepository: MemoryOrderRepository;
    paymentRepository: MemoryPaymentRepository;
    shipmentRepository: MemoryShipmentRepository;
  },
  orders: readonly SeedSalesOrderInput[],
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
      quantity: input.quantity ?? 1,
      lineSubtotal: input.subtotal,
      createdAt: now,
    };
    const order: Order = {
      id: orderId,
      storeId: input.storeId,
      orderNumber: input.orderNumber ?? `ORD-${orderId.slice(0, 8)}`,
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

    if (input.paymentStatus) {
      const payment = await module.paymentRepository.create({
        storeId: input.storeId,
        orderId,
        amount: input.total,
        currency: input.currency ?? "USD",
        provider: "internal",
        reference: `PAY-${orderId.slice(0, 8)}`,
      });

      if (input.paymentStatus !== "pending") {
        await module.paymentRepository.transitionStatus(input.storeId, payment.id, {
          fromStatus: "pending",
          toStatus: input.paymentStatus,
        });
      }
    }

    if (input.warehouseId) {
      const shipment: Shipment = {
        id: crypto.randomUUID(),
        storeId: input.storeId,
        orderId,
        shipmentNumber: `SHP-${orderId.slice(0, 8)}`,
        carrier: "manual",
        shippingRecipientName: "Jane Doe",
        shippingPhone: "+15551234567",
        shippingAddressLine1: "123 Main St",
        shippingCity: "New York",
        shippingStateProvince: "NY",
        shippingPostalCode: "10001",
        shippingCountryCode: "US",
        status: "pending",
        warehouseId: input.warehouseId,
        createdAt: now,
        updatedAt: now,
      };

      module.shipmentRepository.seedShipment(shipment);
    }
  }

  return seededOrders;
}
