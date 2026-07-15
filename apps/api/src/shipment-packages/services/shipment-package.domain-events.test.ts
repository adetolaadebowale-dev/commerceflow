import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryShipmentPackageModule,
  seedPendingShipmentWithPackage,
  TEST_STORE_A_ID,
  validPackageInput,
} from "../testing/shipment-package-test-utils";
import { createPendingShipment } from "@/shipments/testing/shipment-test-utils";

describe("ShipmentPackageService domain events", () => {
  it("emits shipment.package.created when a package is created", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("shipment.package.created", handler);

    const module = createMemoryShipmentPackageModule({
      domainEventPublisher: publisher,
    });
    const { shipment } = await createPendingShipment(module);

    const shipmentPackage = await module.shipmentPackageService.createPackage(
      TEST_STORE_A_ID,
      shipment.id,
      validPackageInput(),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "shipment.package.created",
      aggregateId: shipmentPackage.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        shipmentPackageId: shipmentPackage.id,
        shipmentId: shipment.id,
        packageNumber: shipmentPackage.packageNumber,
      },
    });
  });

  it("emits shipment.package.updated and shipment.package.deleted", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const updatedHandler = vi.fn();
    const deletedHandler = vi.fn();
    dispatcher.subscribe("shipment.package.updated", updatedHandler);
    dispatcher.subscribe("shipment.package.deleted", deletedHandler);

    const module = createMemoryShipmentPackageModule({
      domainEventPublisher: publisher,
    });
    const { shipmentPackage } = await seedPendingShipmentWithPackage(module);

    await module.shipmentPackageService.updatePackage(
      TEST_STORE_A_ID,
      shipmentPackage.id,
      { weight: "4.0" },
    );

    await module.shipmentPackageService.deletePackage(
      TEST_STORE_A_ID,
      shipmentPackage.id,
    );

    await vi.waitFor(() => {
      expect(updatedHandler).toHaveBeenCalledOnce();
      expect(deletedHandler).toHaveBeenCalledOnce();
    });
  });
});
