import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryWarehouseModule,
  TEST_STORE_A_ID,
  validWarehouseInput,
} from "../testing/warehouse-test-utils";

describe("WarehouseService domain events", () => {
  it("emits warehouse.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("warehouse.created", handler);

    const module = createMemoryWarehouseModule({
      domainEventPublisher: publisher,
    });
    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "EVENT" }),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "warehouse.created",
      aggregateId: warehouse.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits warehouse.activated and warehouse.deactivated during lifecycle", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryWarehouseModule({
      domainEventPublisher: publisher,
    });
    await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "DEFAULT" }),
    );

    const activatedHandler = vi.fn();
    const deactivatedHandler = vi.fn();
    dispatcher.subscribe("warehouse.activated", activatedHandler);
    dispatcher.subscribe("warehouse.deactivated", deactivatedHandler);

    const secondary = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "SECONDARY", status: "inactive" }),
    );

    await module.warehouseService.activateWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
    );
    await module.warehouseService.deactivateWarehouse(
      TEST_STORE_A_ID,
      secondary.id,
    );

    await vi.waitFor(() => {
      expect(activatedHandler).toHaveBeenCalledOnce();
      expect(deactivatedHandler).toHaveBeenCalledOnce();
    });
  });
});
