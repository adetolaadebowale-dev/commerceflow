import type { DomainEventPublisher } from "@/domain-events";
import { MemoryPickListRepository } from "../repositories/memory-pick-list.repository";
import { PickListService } from "../services/pick-list.service";
import {
  createMemoryShipmentModule,
  createPendingShipment,
  TEST_STORE_A_ID,
} from "@/shipments/testing/shipment-test-utils";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/shipments/testing/shipment-test-utils";

export function createMemoryPickListModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const shipmentModule = createMemoryShipmentModule(dependencies);
  const pickListRepository = new MemoryPickListRepository();

  return {
    ...shipmentModule,
    pickListRepository,
    pickListService: new PickListService({
      pickListRepository,
      shipmentRepository: shipmentModule.shipmentRepository,
      orderRepository: shipmentModule.orderRepository,
      ...dependencies,
    }),
  };
}

export async function seedPendingPickList(
  module: ReturnType<typeof createMemoryPickListModule>,
) {
  const { order, shipment } = await createPendingShipment(module);
  const pickList = await module.pickListService.createPickList(
    TEST_STORE_A_ID,
    shipment.id,
    {},
  );

  return { order, shipment, pickList };
}

export function fullyPickedItems(
  pickList: Awaited<ReturnType<typeof seedPendingPickList>>["pickList"],
) {
  return {
    items: pickList.items.map((item) => ({
      orderItemId: item.orderItemId,
      quantityPicked: item.quantityRequired,
    })),
  };
}
