import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPlatformOperationsModule,
  TEST_STORE_A_ID,
} from "../testing/platform-operations-test-utils";

describe("MaintenanceModeService domain events", () => {
  it("emits platform.maintenance.enabled when maintenance is turned on", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("platform.maintenance.enabled", handler);

    const module = createMemoryPlatformOperationsModule({
      domainEventPublisher: publisher,
    });

    const maintenance =
      await module.platformOperationsService.updateMaintenanceMode({
        storeId: TEST_STORE_A_ID,
        maintenanceMode: true,
        maintenanceMessage: "Offline",
      });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "platform.maintenance.enabled",
      aggregateType: "platform",
      storeId: TEST_STORE_A_ID,
      payload: {
        maintenanceMode: true,
        maintenanceMessage: "Offline",
        maintenance,
      },
    });
  });

  it("emits platform.maintenance.disabled when maintenance is turned off", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("platform.maintenance.disabled", handler);

    const module = createMemoryPlatformOperationsModule({
      domainEventPublisher: publisher,
    });

    await module.platformOperationsService.updateMaintenanceMode({
      storeId: TEST_STORE_A_ID,
      maintenanceMode: true,
    });

    await module.platformOperationsService.updateMaintenanceMode({
      storeId: TEST_STORE_A_ID,
      maintenanceMode: false,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "platform.maintenance.disabled",
      payload: {
        maintenanceMode: false,
      },
    });
  });
});
