import type { DomainEventPublisher } from "@/domain-events";
import { MemoryInventoryAllocationRepository } from "../repositories/memory-inventory-allocation.repository";
import { InventoryAllocationService } from "../services/inventory-allocation.service";
import {
  createMemoryPickListModule,
  TEST_STORE_A_ID,
} from "@/pick-lists/testing/pick-list-test-utils";
import {
  createPendingShipment,
  TEST_SHIPPING_ADDRESS,
  validShipmentInput,
} from "@/shipments/testing/shipment-test-utils";
import { seedConfirmedReservedOrder } from "@/fulfillment/testing/fulfillment-test-utils";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/pick-lists/testing/pick-list-test-utils";

export function createMemoryInventoryAllocationModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
} = {}) {
  const pickListModule = createMemoryPickListModule(dependencies);
  const inventoryAllocationRepository =
    new MemoryInventoryAllocationRepository();

  return {
    ...pickListModule,
    inventoryAllocationRepository,
    inventoryAllocationService: new InventoryAllocationService({
      inventoryAllocationRepository,
      pickListRepository: pickListModule.pickListRepository,
      shipmentRepository: pickListModule.shipmentRepository,
      inventoryItemRepository: pickListModule.inventoryItemRepository,
      inventoryReservationRepository: pickListModule.reservationRepository,
      orderRepository: pickListModule.orderRepository,
      ...dependencies,
    }),
  };
}

export async function seedPendingPickListWithInventory(
  module: ReturnType<typeof createMemoryInventoryAllocationModule>,
  options: {
    initialQuantity?: number;
    orderQuantity?: number;
  } = {},
) {
  const { inventoryItem, confirmed } = await seedConfirmedReservedOrder(
    module,
    options,
  );

  await module.fulfillmentService.fulfillOrder(
    { storeId: TEST_STORE_A_ID },
    confirmed.id,
  );

  const orderRepository = module.orderRepository as MemoryOrderRepository;
  const fulfilled = await orderRepository.findById(
    TEST_STORE_A_ID,
    confirmed.id,
  );

  if (!fulfilled) {
    throw new Error("Expected fulfilled order");
  }

  orderRepository.seedOrder({
    ...fulfilled,
    shippingAddress: { ...TEST_SHIPPING_ADDRESS },
  });

  const order = await orderRepository.findById(TEST_STORE_A_ID, confirmed.id);

  if (!order) {
    throw new Error("Expected fulfilled order");
  }

  const shipment = await module.shipmentService.createShipment(
    TEST_STORE_A_ID,
    order.id,
    validShipmentInput(),
  );

  const pickList = await module.pickListService.createPickList(
    TEST_STORE_A_ID,
    shipment.id,
    {},
  );

  return { order, shipment, pickList, inventoryItem };
}

export async function seedPickingAllocation(
  module: ReturnType<typeof createMemoryInventoryAllocationModule>,
  options: {
    quantityAllocated?: number;
    initialQuantity?: number;
    orderQuantity?: number;
  } = {},
) {
  const { order, shipment, pickList, inventoryItem } =
    await seedPendingPickListWithInventory(module, options);

  await module.pickListService.startPicking(TEST_STORE_A_ID, pickList.id);

  const pickListItem = pickList.items[0];

  if (!pickListItem) {
    throw new Error("Expected pick list item");
  }

  const allocation = await module.inventoryAllocationService.allocateInventory(
    TEST_STORE_A_ID,
    pickListItem.id,
    {
      inventoryItemId: inventoryItem.id,
      quantityAllocated: options.quantityAllocated ?? pickListItem.quantityRequired,
    },
  );

  return { order, shipment, pickList, inventoryItem, pickListItem, allocation };
}

/** Convenience wrapper matching pick-list tests when default inventory is fine. */
export async function seedPendingPickListFromShipment(
  module: ReturnType<typeof createMemoryInventoryAllocationModule>,
) {
  const { order, shipment } = await createPendingShipment(module);
  const pickList = await module.pickListService.createPickList(
    TEST_STORE_A_ID,
    shipment.id,
    {},
  );

  const listed = await module.inventoryItemRepository.list({
    storeId: TEST_STORE_A_ID,
    page: 1,
    limit: 1,
  });

  const inventoryItem = listed.items[0];

  if (!inventoryItem) {
    throw new Error("Expected inventory item");
  }

  return { order, shipment, pickList, inventoryItem };
}
