import type { CreateShipmentTrackingEventInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { ShipmentService } from "@/shipments/services/shipment.service";
import {
  createMemoryShipmentModule,
  createPendingShipment,
  TEST_STORE_A_ID,
} from "@/shipments/testing/shipment-test-utils";
import { MemoryShipmentTrackingRepository } from "../repositories/memory-shipment-tracking.repository";
import { ShipmentTrackingService } from "../services/shipment-tracking.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/shipments/testing/shipment-test-utils";

export function createMemoryShipmentTrackingModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const shipmentModule = createMemoryShipmentModule(dependencies);
  const shipmentTrackingRepository = new MemoryShipmentTrackingRepository();

  return {
    ...shipmentModule,
    shipmentTrackingRepository,
    shipmentTrackingService: new ShipmentTrackingService({
      shipmentTrackingRepository,
      shipmentRepository: shipmentModule.shipmentRepository,
      ...dependencies,
    }),
  };
}

export function validTrackingEventInput(
  overrides: Partial<CreateShipmentTrackingEventInput> = {},
): CreateShipmentTrackingEventInput {
  return {
    eventType: "location_update",
    description: "Arrived at regional hub",
    location: "Chicago, IL",
    ...overrides,
  };
}

export async function seedPendingShipmentWithTracking(
  module: ReturnType<typeof createMemoryShipmentTrackingModule>,
) {
  const { order, shipment } = await createPendingShipment(module);
  return { order, shipment };
}

export async function createSampleTrackingEvent(
  module: ReturnType<typeof createMemoryShipmentTrackingModule>,
) {
  const { shipment } = await seedPendingShipmentWithTracking(module);

  const trackingEvent = await module.shipmentTrackingService.createTrackingEvent(
    TEST_STORE_A_ID,
    shipment.id,
    validTrackingEventInput(),
  );

  return { shipment, trackingEvent };
}

export type { MemoryShipmentRepository, ShipmentService };
