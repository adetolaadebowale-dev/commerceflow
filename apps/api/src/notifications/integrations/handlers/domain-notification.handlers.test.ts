import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createDomainNotificationTestModule,
  createMockContactResolver,
  sampleOrderConfirmedEvent,
  samplePaymentFailedEvent,
  samplePaymentPaidEvent,
  samplePurchaseOrderReceivedEvent,
  sampleReturnCompletedEvent,
  sampleShipmentDeliveredEvent,
  sampleShipmentShippedEvent,
  TEST_ORDER_ID,
  TEST_STORE_A_ID,
} from "../testing/domain-notification-test-utils";
import { registerDomainNotificationHandlers } from "./domain-notification.handlers";

describe("domain notification handlers", () => {
  it("dispatches notifications when order.confirmed is published", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule({
      config: { "order.confirmed": { email: true, defer: false } },
    });
    const contactResolver = createMockContactResolver();

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      contactResolver,
    );

    await dispatcher.publish(sampleOrderConfirmedEvent());

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(notifications.total).toBe(1);
    expect(notifications.items[0]?.subject).toBe("Order ORD-001 confirmed");
  });

  it("creates deferred jobs for shipment.shipped", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule();
    const contactResolver = createMockContactResolver();

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      contactResolver,
    );

    await dispatcher.publish(sampleShipmentShippedEvent());

    const jobs = await module.jobService.listJobs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(jobs.total).toBe(1);
    expect(jobs.items[0]?.type).toBe("notification.dispatch");
  });

  it("dispatches email and sms for payment.failed", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule();
    const contactResolver = createMockContactResolver();

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      contactResolver,
    );

    await dispatcher.publish(samplePaymentFailedEvent());

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(notifications.items.map((item) => item.channel).sort()).toEqual([
      "email",
      "sms",
    ]);
  });

  it("does not dispatch when storeId is missing", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule();
    const dispatchSpy = vi.spyOn(module.domainNotificationService, "dispatch");

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      createMockContactResolver(),
    );

    await dispatcher.publish(
      sampleOrderConfirmedEvent({ storeId: undefined }),
    );

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("does not dispatch when contact details produce no notifications", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule();
    const dispatchSpy = vi.spyOn(module.domainNotificationService, "dispatch");
    const contactResolver = createMockContactResolver({
      orderCustomer: { email: undefined, phone: undefined },
    });

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      contactResolver,
    );

    await dispatcher.publish(samplePaymentPaidEvent());

    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("handles purchase-order.received with supplier contact", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule();
    const contactResolver = createMockContactResolver();

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      contactResolver,
    );

    await dispatcher.publish(samplePurchaseOrderReceivedEvent());

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(notifications.total).toBe(1);
    expect(notifications.items[0]?.body).toContain("PO-001");
  });

  it("handles return.completed and shipment.delivered events", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule({
      config: {
        "return.completed": { email: true, defer: false },
        "shipment.delivered": { email: true, defer: false },
      },
    });

    registerDomainNotificationHandlers(
      dispatcher,
      module.domainNotificationService,
      createMockContactResolver(),
    );

    await dispatcher.publish(sampleReturnCompletedEvent());
    await dispatcher.publish(sampleShipmentDeliveredEvent());

    const notifications = await module.notificationService.listNotifications({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(notifications.total).toBe(2);
    expect(notifications.items.some((item) => item.body.includes("RET-001"))).toBe(
      true,
    );
    expect(notifications.items.some((item) => item.body.includes("delivered"))).toBe(
      true,
    );
  });

  it("resolves order customer using aggregate id for order.confirmed", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const module = createDomainNotificationTestModule();
    const resolveOrderCustomer = vi.fn(async () => ({
      email: "resolved@example.com",
      name: "Resolved Customer",
    }));

    registerDomainNotificationHandlers(dispatcher, module.domainNotificationService, {
      resolveOrderCustomer,
      resolveSupplierContact: async () => null,
    });

    await dispatcher.publish(sampleOrderConfirmedEvent());

    expect(resolveOrderCustomer).toHaveBeenCalledWith(
      TEST_STORE_A_ID,
      TEST_ORDER_ID,
    );
  });
});
