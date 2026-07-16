import type {
  Customer,
  CustomerAddress,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
} from "@commerceflow/types";

import type { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import type { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import type { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import type { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import type { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";

export interface SeedCustomerInput {
  readonly id?: string;
  readonly storeId: string;
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly status?: Customer["status"];
  readonly createdAt?: string;
  readonly countryCode?: string;
  readonly city?: string;
}

export interface SeedCustomerOrderInput {
  readonly id?: string;
  readonly storeId: string;
  readonly customerProfileId: string;
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
  readonly paymentStatus?: Payment["status"];
  readonly refundAmount?: string;
}

export async function seedCustomerScenario(
  module: {
    customerRepository: MemoryCustomerRepository;
    customerAddressRepository: MemoryCustomerAddressRepository;
    orderRepository: MemoryOrderRepository;
    paymentRepository: MemoryPaymentRepository;
    refundRepository: MemoryRefundRepository;
  },
  customers: readonly SeedCustomerInput[],
  orders: readonly SeedCustomerOrderInput[] = [],
) {
  const seededCustomers: Customer[] = [];

  for (const [index, input] of customers.entries()) {
    const now = input.createdAt ?? new Date().toISOString();
    const customerId = input.id ?? crypto.randomUUID();
    const customer: Customer = {
      id: customerId,
      storeId: input.storeId,
      email: input.email ?? `customer-${index + 1}@example.com`,
      firstName: input.firstName ?? "Jane",
      lastName: input.lastName ?? "Doe",
      status: input.status ?? "active",
      createdAt: now,
      updatedAt: now,
    };

    module.customerRepository.seedCustomer(customer);
    seededCustomers.push(customer);

    if (input.countryCode) {
      const address: CustomerAddress = {
        id: crypto.randomUUID(),
        customerId,
        storeId: input.storeId,
        label: "Home",
        recipientName: `${customer.firstName} ${customer.lastName}`,
        addressLine1: "123 Main St",
        city: input.city ?? "New York",
        stateProvince: "NY",
        postalCode: "10001",
        countryCode: input.countryCode,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };

      module.customerAddressRepository.seedCustomerAddress(address);
    }
  }

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
      customerProfileId: input.customerProfileId,
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
  }

  return seededCustomers;
}
