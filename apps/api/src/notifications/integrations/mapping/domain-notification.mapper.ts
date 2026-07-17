import type {
  DomainEvent,
  DomainNotificationChannelConfig,
  DomainNotificationEventType,
  OrderCustomerContact,
  PaymentFailedPayload,
  PaymentPaidPayload,
  PurchaseOrderReceivedPayload,
  ReturnCompletedPayload,
  ShipmentDeliveredPayload,
  ShipmentShippedPayload,
  SupplierContactInfo,
} from "@commerceflow/types";
import type { CreateNotificationInput } from "@commerceflow/validation";

import { DEFAULT_DOMAIN_NOTIFICATION_CONFIG } from "../domain-notification-config";

export interface DomainNotificationMapperContext {
  readonly storeId: string;
  readonly sourceEventType: DomainNotificationEventType;
  readonly sourceAggregateId: string;
  readonly orderCustomer?: OrderCustomerContact | null;
  readonly supplierContact?: SupplierContactInfo | null;
}

function buildMetadata(
  context: DomainNotificationMapperContext,
): Record<string, unknown> {
  return {
    sourceEventType: context.sourceEventType,
    sourceAggregateId: context.sourceAggregateId,
  };
}

function buildEmailNotification(
  context: DomainNotificationMapperContext,
  input: {
    body: string;
    subject: string;
    customerId?: string;
  },
): CreateNotificationInput | null {
  if (!context.orderCustomer?.email && !context.supplierContact?.email) {
    return null;
  }

  const recipient = context.supplierContact?.email
    ? {
        email: context.supplierContact.email,
        name: context.supplierContact.name,
      }
    : {
        email: context.orderCustomer!.email!,
        name: context.orderCustomer?.name,
      };

  return {
    storeId: context.storeId,
    channel: "email",
    provider: "memory",
    userId: context.orderCustomer?.userId,
    to: recipient,
    subject: input.subject,
    body: input.body,
    customerId: input.customerId ?? context.orderCustomer?.customerId,
    metadata: buildMetadata(context),
  };
}

function buildSmsNotification(
  context: DomainNotificationMapperContext,
  input: {
    body: string;
    customerId?: string;
  },
): CreateNotificationInput | null {
  const phone =
    context.orderCustomer?.phone ?? context.supplierContact?.phone;

  if (!phone) {
    return null;
  }

  return {
    storeId: context.storeId,
    channel: "sms",
    provider: "memory",
    userId: context.orderCustomer?.userId,
    smsTo: {
      phone,
      name: context.orderCustomer?.name ?? context.supplierContact?.name,
    },
    body: input.body,
    customerId: input.customerId ?? context.orderCustomer?.customerId,
    metadata: buildMetadata(context),
  };
}

function buildInAppNotification(
  context: DomainNotificationMapperContext,
  channelConfig: DomainNotificationChannelConfig,
  input: {
    title: string;
    body: string;
    customerId?: string;
  },
): CreateNotificationInput | null {
  if (!channelConfig.userId) {
    return null;
  }

  return {
    storeId: context.storeId,
    channel: "in_app",
    provider: "memory",
    userId: channelConfig.userId ?? context.orderCustomer?.userId,
    title: input.title,
    body: input.body,
    customerId: input.customerId ?? context.orderCustomer?.customerId,
    metadata: buildMetadata(context),
  };
}

function mapForChannels(
  context: DomainNotificationMapperContext,
  channelConfig: DomainNotificationChannelConfig,
  messages: {
    email?: { subject: string; body: string; customerId?: string };
    sms?: { body: string; customerId?: string };
    in_app?: { title: string; body: string; customerId?: string };
  },
): CreateNotificationInput[] {
  const notifications: CreateNotificationInput[] = [];

  if (channelConfig.email && messages.email) {
    const email = buildEmailNotification(context, messages.email);
    if (email) {
      notifications.push(email);
    }
  }

  if (channelConfig.sms && messages.sms) {
    const sms = buildSmsNotification(context, messages.sms);
    if (sms) {
      notifications.push(sms);
    }
  }

  if (channelConfig.in_app && messages.in_app) {
    const inApp = buildInAppNotification(
      context,
      channelConfig,
      messages.in_app,
    );
    if (inApp) {
      notifications.push(inApp);
    }
  }

  return notifications;
}

export function mapOrderConfirmedNotification(
  event: DomainEvent,
  orderCustomer: OrderCustomerContact | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "order.confirmed"
  ],
): CreateNotificationInput[] {
  const payload = event.payload as {
    orderNumber: string;
    total: string;
    currency: string;
  };

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "order.confirmed",
      sourceAggregateId: event.aggregateId,
      orderCustomer,
    },
    channelConfig,
    {
      email: {
        subject: `Order ${payload.orderNumber} confirmed`,
        body: `Your order ${payload.orderNumber} has been confirmed. Total: ${payload.total} ${payload.currency}.`,
      },
      sms: {
        body: `Order ${payload.orderNumber} confirmed. Total: ${payload.total} ${payload.currency}.`,
      },
      in_app: {
        title: "Order confirmed",
        body: `Order ${payload.orderNumber} has been confirmed.`,
      },
    },
  );
}

export function mapPaymentPaidNotification(
  event: DomainEvent<PaymentPaidPayload>,
  orderCustomer: OrderCustomerContact | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "payment.paid"
  ],
): CreateNotificationInput[] {
  const { payment } = event.payload;

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "payment.paid",
      sourceAggregateId: event.aggregateId,
      orderCustomer,
    },
    channelConfig,
    {
      email: {
        subject: "Payment received",
        body: `Payment of ${payment.amount} ${payment.currency} was received for order ${payment.orderId}.`,
      },
      sms: {
        body: `Payment of ${payment.amount} ${payment.currency} received.`,
      },
      in_app: {
        title: "Payment received",
        body: `Payment of ${payment.amount} ${payment.currency} was received.`,
      },
    },
  );
}

export function mapPaymentFailedNotification(
  event: DomainEvent<PaymentFailedPayload>,
  orderCustomer: OrderCustomerContact | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "payment.failed"
  ],
): CreateNotificationInput[] {
  const { payment } = event.payload;

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "payment.failed",
      sourceAggregateId: event.aggregateId,
      orderCustomer,
    },
    channelConfig,
    {
      email: {
        subject: "Payment failed",
        body: `Payment of ${payment.amount} ${payment.currency} failed for order ${payment.orderId}.`,
      },
      sms: {
        body: `Payment of ${payment.amount} ${payment.currency} failed.`,
      },
      in_app: {
        title: "Payment failed",
        body: `Payment of ${payment.amount} ${payment.currency} failed.`,
      },
    },
  );
}

export function mapShipmentShippedNotification(
  event: DomainEvent<ShipmentShippedPayload>,
  orderCustomer: OrderCustomerContact | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "shipment.shipped"
  ],
): CreateNotificationInput[] {
  const { shipmentNumber, shipment } = event.payload;

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "shipment.shipped",
      sourceAggregateId: event.aggregateId,
      orderCustomer: orderCustomer ?? {
        name: shipment.shippingRecipientName,
        phone: shipment.shippingPhone,
      },
    },
    channelConfig,
    {
      email: {
        subject: `Shipment ${shipmentNumber} shipped`,
        body: `Shipment ${shipmentNumber} for order ${shipment.orderId} has shipped.`,
      },
      sms: {
        body: `Shipment ${shipmentNumber} has shipped.`,
      },
      in_app: {
        title: "Shipment shipped",
        body: `Shipment ${shipmentNumber} is on the way.`,
      },
    },
  );
}

export function mapShipmentDeliveredNotification(
  event: DomainEvent<ShipmentDeliveredPayload>,
  orderCustomer: OrderCustomerContact | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "shipment.delivered"
  ],
): CreateNotificationInput[] {
  const { shipmentNumber, shipment } = event.payload;

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "shipment.delivered",
      sourceAggregateId: event.aggregateId,
      orderCustomer: orderCustomer ?? {
        name: shipment.shippingRecipientName,
        phone: shipment.shippingPhone,
      },
    },
    channelConfig,
    {
      email: {
        subject: `Shipment ${shipmentNumber} delivered`,
        body: `Shipment ${shipmentNumber} for order ${shipment.orderId} has been delivered.`,
      },
      sms: {
        body: `Shipment ${shipmentNumber} has been delivered.`,
      },
      in_app: {
        title: "Shipment delivered",
        body: `Shipment ${shipmentNumber} was delivered.`,
      },
    },
  );
}

export function mapReturnCompletedNotification(
  event: DomainEvent<ReturnCompletedPayload>,
  orderCustomer: OrderCustomerContact | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "return.completed"
  ],
): CreateNotificationInput[] {
  const { returnNumber } = event.payload;

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "return.completed",
      sourceAggregateId: event.aggregateId,
      orderCustomer,
    },
    channelConfig,
    {
      email: {
        subject: `Return ${returnNumber} completed`,
        body: `Return ${returnNumber} has been completed.`,
      },
      sms: {
        body: `Return ${returnNumber} has been completed.`,
      },
      in_app: {
        title: "Return completed",
        body: `Return ${returnNumber} has been completed.`,
      },
    },
  );
}

export function mapPurchaseOrderReceivedNotification(
  event: DomainEvent<PurchaseOrderReceivedPayload>,
  supplierContact: SupplierContactInfo | null,
  channelConfig: DomainNotificationChannelConfig = DEFAULT_DOMAIN_NOTIFICATION_CONFIG[
    "purchase-order.received"
  ],
): CreateNotificationInput[] {
  const { purchaseOrderNumber } = event.payload;

  return mapForChannels(
    {
      storeId: event.storeId!,
      sourceEventType: "purchase-order.received",
      sourceAggregateId: event.aggregateId,
      supplierContact,
    },
    channelConfig,
    {
      email: {
        subject: `Purchase order ${purchaseOrderNumber} received`,
        body: `Purchase order ${purchaseOrderNumber} has been received into inventory.`,
      },
      sms: {
        body: `Purchase order ${purchaseOrderNumber} received.`,
      },
      in_app: {
        title: "Purchase order received",
        body: `Purchase order ${purchaseOrderNumber} was received.`,
      },
    },
  );
}
