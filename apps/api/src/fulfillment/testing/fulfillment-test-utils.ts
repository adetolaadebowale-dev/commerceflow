import { MemoryFulfillmentRepository } from "../repositories/memory-fulfillment.repository";
import {
  FulfillmentService,
  type FulfillmentServiceDependencies,
} from "../services/fulfillment.service";
import { MemoryInventoryAllocationRepository } from "../../inventory-allocation/repositories/memory-inventory-allocation.repository";
import { InventoryAllocationService } from "../../inventory-allocation/services/inventory-allocation.service";
import {
  createMemoryPickListModule,
  fullyPickedItems,
  TEST_STORE_A_ID,
} from "../../pick-lists/testing/pick-list-test-utils";
import { MemoryStockMovementRepository } from "../../inventory/repositories/memory-stock-movement.repository";
import {
  createMemoryReservationService,
  seedConfirmedOrderWithInventory,
} from "../../reservations/testing/reservation-test-utils";
import {
  TEST_SHIPPING_ADDRESS,
} from "../../shipments/testing/shipment-test-utils";
import { MemoryOrderRepository } from "../../orders/repositories/memory-order.repository";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../reservations/testing/reservation-test-utils";

export function createMemoryFulfillmentService() {
  const reservationServices = createMemoryReservationService();
  const fulfillmentRepository = new MemoryFulfillmentRepository(
    reservationServices.orderRepository,
    reservationServices.reservationRepository,
    reservationServices.inventoryItemRepository,
  );
  const stockMovementRepository = new MemoryStockMovementRepository(
    reservationServices.inventoryItemRepository,
  );

  return {
    ...reservationServices,
    fulfillmentRepository,
    stockMovementRepository,
    fulfillmentService: new FulfillmentService({
      fulfillmentRepository,
      stockMovementRepository,
    }),
  };
}

export function createMemoryShipmentFulfillmentModule(
  dependencies: Pick<FulfillmentServiceDependencies, "domainEventPublisher"> = {},
) {
  const pickListModule = createMemoryPickListModule(dependencies);
  const inventoryAllocationRepository =
    new MemoryInventoryAllocationRepository();
  const fulfillmentRepository = new MemoryFulfillmentRepository(
    pickListModule.orderRepository,
    pickListModule.reservationRepository,
    pickListModule.inventoryItemRepository,
    pickListModule.shipmentRepository,
    pickListModule.pickListRepository,
    inventoryAllocationRepository,
  );
  const stockMovementRepository = new MemoryStockMovementRepository(
    pickListModule.inventoryItemRepository,
  );

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
    fulfillmentRepository,
    stockMovementRepository,
    fulfillmentService: new FulfillmentService({
      fulfillmentRepository,
      stockMovementRepository,
      ...dependencies,
    }),
  };
}

export async function seedConfirmedReservedOrder(
  services: ReturnType<typeof createMemoryFulfillmentService>,
  options: {
    initialQuantity?: number;
    orderQuantity?: number;
  } = {},
) {
  const { inventoryItem, confirmed } = await seedConfirmedOrderWithInventory(
    services,
    options,
  );

  const reservations = await services.reservationService.reserveOrder(
    { storeId: TEST_STORE_A_ID },
    confirmed.id,
  );

  return { inventoryItem, confirmed, reservations };
}

export async function seedPackedShipmentWithAllocations(
  module: ReturnType<typeof createMemoryShipmentFulfillmentModule>,
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
    throw new Error("Expected order with shipping address");
  }

  const shipment = await module.shipmentService.createShipment(
    TEST_STORE_A_ID,
    order.id,
    { carrier: "internal" },
  );

  const pickList = await module.pickListService.createPickList(
    TEST_STORE_A_ID,
    shipment.id,
    {},
  );

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
      quantityAllocated: pickListItem.quantityRequired,
    },
  );

  await module.inventoryAllocationService.updatePickedQuantity(
    TEST_STORE_A_ID,
    allocation.id,
    { quantityPicked: allocation.quantityAllocated },
  );

  await module.pickListService.completePicking(
    TEST_STORE_A_ID,
    pickList.id,
    fullyPickedItems(pickList),
  );

  const packedPickList = await module.pickListService.markPacked(
    TEST_STORE_A_ID,
    pickList.id,
  );

  return {
    order,
    shipment,
    pickList: packedPickList,
    inventoryItem,
    allocation,
  };
}

export async function seedPickedNotPackedShipment(
  module: ReturnType<typeof createMemoryShipmentFulfillmentModule>,
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
    throw new Error("Expected order with shipping address");
  }

  const shipment = await module.shipmentService.createShipment(
    TEST_STORE_A_ID,
    order.id,
    { carrier: "internal" },
  );

  const pickList = await module.pickListService.createPickList(
    TEST_STORE_A_ID,
    shipment.id,
    {},
  );

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
      quantityAllocated: pickListItem.quantityRequired,
    },
  );

  await module.inventoryAllocationService.updatePickedQuantity(
    TEST_STORE_A_ID,
    allocation.id,
    { quantityPicked: allocation.quantityAllocated },
  );

  const pickedPickList = await module.pickListService.completePicking(
    TEST_STORE_A_ID,
    pickList.id,
    fullyPickedItems(pickList),
  );

  return {
    order,
    shipment,
    pickList: pickedPickList,
    inventoryItem,
    allocation,
  };
}
