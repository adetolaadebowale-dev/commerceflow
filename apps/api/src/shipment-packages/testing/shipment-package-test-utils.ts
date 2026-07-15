import type { CreateShipmentPackageInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { ShipmentService } from "@/shipments/services/shipment.service";
import {
  createMemoryShipmentModule,
  createPendingShipment,
  TEST_STORE_A_ID,
} from "@/shipments/testing/shipment-test-utils";
import { MemoryShipmentPackageRepository } from "../repositories/memory-shipment-package.repository";
import { ShipmentPackageService } from "../services/shipment-package.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/shipments/testing/shipment-test-utils";

export function createMemoryShipmentPackageModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const shipmentModule = createMemoryShipmentModule(dependencies);
  const shipmentPackageRepository = new MemoryShipmentPackageRepository();

  return {
    ...shipmentModule,
    shipmentPackageRepository,
    shipmentPackageService: new ShipmentPackageService({
      shipmentPackageRepository,
      shipmentRepository: shipmentModule.shipmentRepository,
      ...dependencies,
    }),
  };
}

export function validPackageInput(
  overrides: Partial<CreateShipmentPackageInput> = {},
): CreateShipmentPackageInput {
  return {
    weight: "2.5",
    weightUnit: "kg",
    length: "30",
    width: "20",
    height: "10",
    dimensionUnit: "cm",
    ...overrides,
  };
}

export async function seedPendingShipmentWithPackage(
  module: ReturnType<typeof createMemoryShipmentPackageModule>,
) {
  const { order, shipment } = await createPendingShipment(module);

  const shipmentPackage = await module.shipmentPackageService.createPackage(
    TEST_STORE_A_ID,
    shipment.id,
    validPackageInput(),
  );

  return { order, shipment, shipmentPackage };
}

export type { MemoryShipmentRepository, ShipmentService };
