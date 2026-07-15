import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryShippingConfigurationModule,
  TEST_STORE_A_ID,
  validShippingMethodInput,
  validShippingZoneInput,
} from "../testing/shipping-configuration-test-utils";

describe("ShippingZoneService domain events", () => {
  it("emits shipping-zone.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipping-zone.created", handler);

    const module = createMemoryShippingConfigurationModule({
      domainEventPublisher: publisher,
    });
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput(),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "shipping-zone.created",
      aggregateId: zone.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits shipping-zone.updated after successful update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipping-zone.updated", handler);

    const module = createMemoryShippingConfigurationModule({
      domainEventPublisher: publisher,
    });
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput(),
    );

    await module.shippingZoneService.updateShippingZone(
      TEST_STORE_A_ID,
      zone.id,
      { name: "Updated" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("shipping-zone.updated");
  });

  it("emits shipping-zone.deleted after soft delete", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipping-zone.deleted", handler);

    const module = createMemoryShippingConfigurationModule({
      domainEventPublisher: publisher,
    });
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput(),
    );

    await module.shippingZoneService.softDeleteShippingZone(
      TEST_STORE_A_ID,
      zone.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("shipping-zone.deleted");
  });
});

describe("ShippingMethodService domain events", () => {
  it("emits shipping-method.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipping-method.created", handler);

    const module = createMemoryShippingConfigurationModule({
      domainEventPublisher: publisher,
    });
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );
    const method = await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "shipping-method.created",
      aggregateId: method.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits shipping-method.updated after successful update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipping-method.updated", handler);

    const module = createMemoryShippingConfigurationModule({
      domainEventPublisher: publisher,
    });
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );
    const method = await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id),
    );

    await module.shippingMethodService.updateShippingMethod(
      TEST_STORE_A_ID,
      method.id,
      { name: "Updated" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("shipping-method.updated");
  });

  it("emits shipping-method.deleted after soft delete", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipping-method.deleted", handler);

    const module = createMemoryShippingConfigurationModule({
      domainEventPublisher: publisher,
    });
    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );
    const method = await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id),
    );

    await module.shippingMethodService.softDeleteShippingMethod(
      TEST_STORE_A_ID,
      method.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("shipping-method.deleted");
  });
});
