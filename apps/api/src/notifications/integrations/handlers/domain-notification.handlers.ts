import type {
  DomainEvent,
  PaymentFailedPayload,
  PaymentPaidPayload,
  PurchaseOrderReceivedPayload,
  ReturnCompletedPayload,
  ShipmentDeliveredPayload,
  ShipmentShippedPayload,
} from "@commerceflow/types";

import type { DomainEventDispatcher } from "@/domain-events/dispatcher";
import {
  domainNotificationContactResolver,
  type DomainNotificationContactResolver,
} from "../mapping/domain-notification-contact.resolver";
import {
  mapOrderConfirmedNotification,
  mapPaymentFailedNotification,
  mapPaymentPaidNotification,
  mapPurchaseOrderReceivedNotification,
  mapReturnCompletedNotification,
  mapShipmentDeliveredNotification,
  mapShipmentShippedNotification,
} from "../mapping/domain-notification.mapper";
import {
  DomainNotificationService,
  domainNotificationService,
} from "../services/domain-notification.service";

async function handleDomainEvent(
  service: DomainNotificationService,
  contactResolver: DomainNotificationContactResolver,
  event: DomainEvent,
  mapNotifications: (
    event: DomainEvent,
    resolver: DomainNotificationContactResolver,
  ) => Promise<Parameters<DomainNotificationService["dispatch"]>[0]["notifications"]>,
): Promise<void> {
  if (!event.storeId) {
    return;
  }

  const notifications = await mapNotifications(event, contactResolver);

  if (notifications.length === 0) {
    return;
  }

  await service.dispatch({
    storeId: event.storeId,
    sourceEventType: event.eventType as Parameters<
      DomainNotificationService["dispatch"]
    >[0]["sourceEventType"],
    sourceAggregateId: event.aggregateId,
    notifications,
  });
}

export function registerDomainNotificationHandlers(
  dispatcher: DomainEventDispatcher,
  service: DomainNotificationService = domainNotificationService,
  contactResolver: DomainNotificationContactResolver = domainNotificationContactResolver,
): void {
  dispatcher.subscribe("order.confirmed", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const orderCustomer = await contactResolver.resolveOrderCustomer(
        domainEvent.storeId!,
        domainEvent.aggregateId,
      );

      return mapOrderConfirmedNotification(
        domainEvent,
        orderCustomer,
        service.getConfig()["order.confirmed"],
      );
    });
  });

  dispatcher.subscribe("payment.paid", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const payload = domainEvent.payload as PaymentPaidPayload;
      const orderCustomer = await contactResolver.resolveOrderCustomer(
        domainEvent.storeId!,
        payload.orderId,
      );

      return mapPaymentPaidNotification(
        domainEvent as DomainEvent<PaymentPaidPayload>,
        orderCustomer,
        service.getConfig()["payment.paid"],
      );
    });
  });

  dispatcher.subscribe("payment.failed", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const payload = domainEvent.payload as PaymentFailedPayload;
      const orderCustomer = await contactResolver.resolveOrderCustomer(
        domainEvent.storeId!,
        payload.orderId,
      );

      return mapPaymentFailedNotification(
        domainEvent as DomainEvent<PaymentFailedPayload>,
        orderCustomer,
        service.getConfig()["payment.failed"],
      );
    });
  });

  dispatcher.subscribe("shipment.shipped", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const payload = domainEvent.payload as ShipmentShippedPayload;
      const orderCustomer = await contactResolver.resolveOrderCustomer(
        domainEvent.storeId!,
        payload.orderId,
      );

      return mapShipmentShippedNotification(
        domainEvent as DomainEvent<ShipmentShippedPayload>,
        orderCustomer,
        service.getConfig()["shipment.shipped"],
      );
    });
  });

  dispatcher.subscribe("shipment.delivered", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const payload = domainEvent.payload as ShipmentDeliveredPayload;
      const orderCustomer = await contactResolver.resolveOrderCustomer(
        domainEvent.storeId!,
        payload.orderId,
      );

      return mapShipmentDeliveredNotification(
        domainEvent as DomainEvent<ShipmentDeliveredPayload>,
        orderCustomer,
        service.getConfig()["shipment.delivered"],
      );
    });
  });

  dispatcher.subscribe("return.completed", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const payload = domainEvent.payload as ReturnCompletedPayload;
      const orderCustomer = await contactResolver.resolveOrderCustomer(
        domainEvent.storeId!,
        payload.orderId,
      );

      return mapReturnCompletedNotification(
        domainEvent as DomainEvent<ReturnCompletedPayload>,
        orderCustomer,
        service.getConfig()["return.completed"],
      );
    });
  });

  dispatcher.subscribe("purchase-order.received", async (event) => {
    await handleDomainEvent(service, contactResolver, event, async (domainEvent) => {
      const payload = domainEvent.payload as PurchaseOrderReceivedPayload;
      const supplierContact = await contactResolver.resolveSupplierContact(
        domainEvent.storeId!,
        payload.result.purchaseOrder.supplierId,
      );

      return mapPurchaseOrderReceivedNotification(
        domainEvent as DomainEvent<PurchaseOrderReceivedPayload>,
        supplierContact,
        service.getConfig()["purchase-order.received"],
      );
    });
  });
}
