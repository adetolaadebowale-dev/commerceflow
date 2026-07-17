import type {
  DomainEvent,
  OrderCustomerContact,
  Payment,
  PaymentFailedPayload,
  PaymentPaidPayload,
  PurchaseOrder,
  PurchaseOrderReceivedPayload,
  ReturnCompletedPayload,
  Shipment,
  ShipmentDeliveredPayload,
  ShipmentShippedPayload,
  SupplierContactInfo,
} from "@commerceflow/types";
import { getDomainNotificationConfig } from "../domain-notification-config";

import { createDomainEvent } from "@/domain-events/domain-event-factory";
import {
  createMemoryJobModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/jobs/testing/job-test-utils";
import { createMemoryNotificationPreferenceModule } from "@/notification-preferences/testing/notification-preference-test-utils";
import {
  createMemoryNotificationModule,
  TEST_USER_A_ID,
} from "../../testing/notification-test-utils";
import type { DomainNotificationContactResolver } from "../mapping/domain-notification-contact.resolver";
import { DomainNotificationService } from "../services/domain-notification.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_USER_A_ID,
};

export const TEST_ORDER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_PAYMENT_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const TEST_SHIPMENT_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
export const TEST_RETURN_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
export const TEST_PURCHASE_ORDER_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
export const TEST_SUPPLIER_ID = "ffffffff-ffff-ffff-ffff-ffffffffffff";

export function sampleOrderCustomer(
  overrides: Partial<OrderCustomerContact> = {},
): OrderCustomerContact {
  return {
    userId: TEST_USER_A_ID,
    customerId: "customer-id",
    email: "customer@example.com",
    phone: "+15551234567",
    name: "Jane Doe",
    ...overrides,
  };
}

export function sampleSupplierContact(
  overrides: Partial<SupplierContactInfo> = {},
): SupplierContactInfo {
  return {
    supplierId: TEST_SUPPLIER_ID,
    email: "supplier@example.com",
    phone: "+15559876543",
    name: "Acme Supplies",
    ...overrides,
  };
}

export function samplePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: TEST_PAYMENT_ID,
    storeId: TEST_STORE_A_ID,
    orderId: TEST_ORDER_ID,
    amount: "99.99",
    currency: "USD",
    status: "paid",
    provider: "internal",
    reference: "pay-ref",
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

export function sampleShipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: TEST_SHIPMENT_ID,
    storeId: TEST_STORE_A_ID,
    orderId: TEST_ORDER_ID,
    shipmentNumber: "SHP-001",
    carrier: "internal",
    shippingRecipientName: "Jane Doe",
    shippingPhone: "+15551234567",
    shippingAddressLine1: "123 Main St",
    shippingCity: "Springfield",
    shippingStateProvince: "IL",
    shippingPostalCode: "62701",
    shippingCountryCode: "US",
    status: "shipped",
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

export function samplePurchaseOrder(
  overrides: Partial<PurchaseOrder> = {},
): PurchaseOrder {
  return {
    id: TEST_PURCHASE_ORDER_ID,
    storeId: TEST_STORE_A_ID,
    warehouseId: "warehouse-id",
    supplierId: TEST_SUPPLIER_ID,
    purchaseOrderNumber: "PO-001",
    status: "received",
    items: [],
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

export function sampleOrderConfirmedEvent(
  overrides: Partial<DomainEvent> = {},
): DomainEvent {
  return createDomainEvent({
    eventType: "order.confirmed",
    aggregateType: "order",
    aggregateId: TEST_ORDER_ID,
    storeId: TEST_STORE_A_ID,
    payload: {
      orderId: TEST_ORDER_ID,
      orderNumber: "ORD-001",
      previousStatus: "draft",
      status: "confirmed",
      subtotal: "99.99",
      total: "99.99",
      currency: "USD",
      itemCount: 1,
    },
    ...overrides,
  });
}

export function samplePaymentPaidEvent(
  overrides: Partial<DomainEvent<PaymentPaidPayload>> = {},
): DomainEvent<PaymentPaidPayload> {
  const payment = samplePayment();

  return createDomainEvent({
    eventType: "payment.paid",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: TEST_STORE_A_ID,
    payload: {
      paymentId: payment.id,
      orderId: TEST_ORDER_ID,
      previousStatus: "authorized",
      status: "paid",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
    ...overrides,
  });
}

export function samplePaymentFailedEvent(
  overrides: Partial<DomainEvent<PaymentFailedPayload>> = {},
): DomainEvent<PaymentFailedPayload> {
  const payment = samplePayment({ status: "failed" });

  return createDomainEvent({
    eventType: "payment.failed",
    aggregateType: "payment",
    aggregateId: payment.id,
    storeId: TEST_STORE_A_ID,
    payload: {
      paymentId: payment.id,
      orderId: TEST_ORDER_ID,
      previousStatus: "authorized",
      status: "failed",
      amount: payment.amount,
      currency: payment.currency,
      payment,
    },
    ...overrides,
  });
}

export function sampleShipmentShippedEvent(
  overrides: Partial<DomainEvent<ShipmentShippedPayload>> = {},
): DomainEvent<ShipmentShippedPayload> {
  const shipment = sampleShipment();

  return createDomainEvent({
    eventType: "shipment.shipped",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: TEST_STORE_A_ID,
    payload: {
      shipmentId: shipment.id,
      orderId: TEST_ORDER_ID,
      shipmentNumber: shipment.shipmentNumber,
      previousStatus: "pending",
      status: "shipped",
      shipment,
    },
    ...overrides,
  });
}

export function sampleShipmentDeliveredEvent(
  overrides: Partial<DomainEvent<ShipmentDeliveredPayload>> = {},
): DomainEvent<ShipmentDeliveredPayload> {
  const shipment = sampleShipment({ status: "delivered" });

  return createDomainEvent({
    eventType: "shipment.delivered",
    aggregateType: "shipment",
    aggregateId: shipment.id,
    storeId: TEST_STORE_A_ID,
    payload: {
      shipmentId: shipment.id,
      orderId: TEST_ORDER_ID,
      shipmentNumber: shipment.shipmentNumber,
      previousStatus: "shipped",
      status: "delivered",
      shipment,
    },
    ...overrides,
  });
}

export function sampleReturnCompletedEvent(
  overrides: Partial<DomainEvent<ReturnCompletedPayload>> = {},
): DomainEvent<ReturnCompletedPayload> {
  return createDomainEvent({
    eventType: "return.completed",
    aggregateType: "return",
    aggregateId: TEST_RETURN_ID,
    storeId: TEST_STORE_A_ID,
    payload: {
      returnId: TEST_RETURN_ID,
      orderId: TEST_ORDER_ID,
      shipmentId: TEST_SHIPMENT_ID,
      returnNumber: "RET-001",
      status: "completed",
      stockMovementCount: 1,
      result: {
        return: {
          id: TEST_RETURN_ID,
          storeId: TEST_STORE_A_ID,
          orderId: TEST_ORDER_ID,
          shipmentId: TEST_SHIPMENT_ID,
          returnNumber: "RET-001",
          status: "completed",
          reason: "damaged",
          requestedAt: "2026-07-16T00:00:00.000Z",
          items: [],
          createdAt: "2026-07-16T00:00:00.000Z",
          updatedAt: "2026-07-16T00:00:00.000Z",
        },
        stockMovements: [],
        inventoryItems: [],
      },
    },
    ...overrides,
  });
}

export function samplePurchaseOrderReceivedEvent(
  overrides: Partial<DomainEvent<PurchaseOrderReceivedPayload>> = {},
): DomainEvent<PurchaseOrderReceivedPayload> {
  const purchaseOrder = samplePurchaseOrder();

  return createDomainEvent({
    eventType: "purchase-order.received",
    aggregateType: "purchase_order",
    aggregateId: purchaseOrder.id,
    storeId: TEST_STORE_A_ID,
    payload: {
      purchaseOrderId: purchaseOrder.id,
      purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
      previousStatus: "ordered",
      status: "received",
      stockMovementCount: 1,
      result: {
        purchaseOrder,
        stockMovements: [],
      },
    },
    ...overrides,
  });
}

export function createMockContactResolver(
  options: {
    orderCustomer?: OrderCustomerContact | null;
    supplierContact?: SupplierContactInfo | null;
  } = {},
): DomainNotificationContactResolver {
  return {
    resolveOrderCustomer: async () => options.orderCustomer ?? sampleOrderCustomer(),
    resolveSupplierContact: async () =>
      options.supplierContact ?? sampleSupplierContact(),
  };
}

export function createDomainNotificationTestModule(options: {
  config?: Parameters<typeof getDomainNotificationConfig>[0];
} = {}) {
  const notificationModule = createMemoryNotificationModule();
  const jobModule = createMemoryJobModule();
  const preferenceModule = createMemoryNotificationPreferenceModule();

  const domainNotificationService = new DomainNotificationService({
    notificationService: notificationModule.notificationService,
    jobService: jobModule.jobService,
    preferenceService: preferenceModule.notificationPreferenceService,
    config: getDomainNotificationConfig(options.config),
  });

  return {
    ...notificationModule,
    ...jobModule,
    ...preferenceModule,
    domainNotificationService,
  };
}
