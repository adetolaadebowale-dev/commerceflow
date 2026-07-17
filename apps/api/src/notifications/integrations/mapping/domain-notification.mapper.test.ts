import { describe, expect, it } from "vitest";

import {
  sampleOrderConfirmedEvent,
  sampleOrderCustomer,
  samplePaymentFailedEvent,
  samplePaymentPaidEvent,
  samplePurchaseOrderReceivedEvent,
  sampleReturnCompletedEvent,
  sampleShipmentDeliveredEvent,
  sampleShipmentShippedEvent,
  sampleSupplierContact,
  TEST_STORE_A_ID,
  TEST_USER_A_ID,
} from "../testing/domain-notification-test-utils";
import {
  mapOrderConfirmedNotification,
  mapPaymentFailedNotification,
  mapPaymentPaidNotification,
  mapPurchaseOrderReceivedNotification,
  mapReturnCompletedNotification,
  mapShipmentDeliveredNotification,
  mapShipmentShippedNotification,
} from "./domain-notification.mapper";

describe("domain notification mapper", () => {
  it("maps order.confirmed to email notifications", () => {
    const notifications = mapOrderConfirmedNotification(
      sampleOrderConfirmedEvent(),
      sampleOrderCustomer(),
      { email: true },
    );

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      storeId: TEST_STORE_A_ID,
      channel: "email",
      subject: "Order ORD-001 confirmed",
      body: expect.stringContaining("ORD-001"),
      to: { email: "customer@example.com", name: "Jane Doe" },
      metadata: {
        sourceEventType: "order.confirmed",
        sourceAggregateId: expect.any(String),
      },
    });
  });

  it("maps payment.paid across email, sms, and in_app when configured", () => {
    const notifications = mapPaymentPaidNotification(
      samplePaymentPaidEvent(),
      sampleOrderCustomer(),
      { email: true, sms: true, in_app: true, userId: TEST_USER_A_ID },
    );

    expect(notifications.map((item) => item.channel)).toEqual([
      "email",
      "sms",
      "in_app",
    ]);
    expect(notifications[2]).toMatchObject({
      channel: "in_app",
      userId: TEST_USER_A_ID,
      title: "Payment received",
    });
  });

  it("maps payment.failed to email and sms when both channels are enabled", () => {
    const notifications = mapPaymentFailedNotification(
      samplePaymentFailedEvent(),
      sampleOrderCustomer(),
      { email: true, sms: true },
    );

    expect(notifications.map((item) => item.channel)).toEqual(["email", "sms"]);
    expect(notifications[1]?.body).toContain("failed");
  });

  it("skips channels when contact details are missing", () => {
    const notifications = mapPaymentFailedNotification(
      samplePaymentFailedEvent(),
      sampleOrderCustomer({ email: undefined, phone: undefined }),
      { email: true, sms: true },
    );

    expect(notifications).toHaveLength(0);
  });

  it("falls back to shipment shipping contact for sms when order customer is missing", () => {
    const notifications = mapShipmentShippedNotification(
      sampleShipmentShippedEvent(),
      null,
      { sms: true },
    );

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.smsTo).toMatchObject({
      phone: "+15551234567",
      name: "Jane Doe",
    });
  });

  it("maps shipment.delivered notifications", () => {
    const notifications = mapShipmentDeliveredNotification(
      sampleShipmentDeliveredEvent(),
      sampleOrderCustomer(),
      { email: true },
    );

    expect(notifications[0]).toMatchObject({
      channel: "email",
      subject: "Shipment SHP-001 delivered",
    });
  });

  it("maps return.completed notifications", () => {
    const notifications = mapReturnCompletedNotification(
      sampleReturnCompletedEvent(),
      sampleOrderCustomer(),
      { email: true },
    );

    expect(notifications[0]?.body).toContain("RET-001");
  });

  it("maps purchase-order.received to supplier contacts", () => {
    const notifications = mapPurchaseOrderReceivedNotification(
      samplePurchaseOrderReceivedEvent(),
      sampleSupplierContact(),
      { email: true, sms: true },
    );

    expect(notifications[0]?.to).toMatchObject({
      email: "supplier@example.com",
      name: "Acme Supplies",
    });
    expect(notifications[1]?.smsTo).toMatchObject({
      phone: "+15559876543",
    });
  });

  it("skips in_app when userId is not configured", () => {
    const notifications = mapOrderConfirmedNotification(
      sampleOrderConfirmedEvent(),
      sampleOrderCustomer(),
      { email: false, in_app: true },
    );

    expect(notifications).toHaveLength(0);
  });
});
