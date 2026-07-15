import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { FulfillmentService } from "./fulfillment.service";
import {
  createMemoryFulfillmentService,
  seedConfirmedReservedOrder,
  TEST_STORE_A_ID,
} from "../testing/fulfillment-test-utils";

describe("FulfillmentService domain events", () => {
  it("emits order.fulfilled after successful fulfillment", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("order.fulfilled", handler);

    const services = createMemoryFulfillmentService();
    const fulfillmentService = new FulfillmentService({
      fulfillmentRepository: services.fulfillmentRepository,
      domainEventPublisher: publisher,
    });
    const { confirmed } = await seedConfirmedReservedOrder(services);

    await fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "order.fulfilled",
      aggregateId: confirmed.id,
      payload: {
        orderId: confirmed.id,
        status: "fulfilled",
      },
    });
  });

  it("emits stock-movement.created for each order fulfillment movement", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("stock-movement.created", handler);

    const services = createMemoryFulfillmentService();
    const fulfillmentService = new FulfillmentService({
      fulfillmentRepository: services.fulfillmentRepository,
      domainEventPublisher: publisher,
    });
    const { confirmed } = await seedConfirmedReservedOrder(services);

    const result = await fulfillmentService.fulfillOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "stock-movement.created",
      aggregateId: result.stockMovements[0]?.id,
      payload: {
        movementType: "fulfillment",
      },
    });
  });
});
