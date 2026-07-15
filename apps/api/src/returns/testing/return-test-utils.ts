import type { DomainEventPublisher } from "@/domain-events";
import { MemoryReturnRepository } from "../repositories/memory-return.repository";
import { ReturnService } from "../services/return.service";
import {
  createMemoryShipmentFulfillmentModule,
  seedPackedShipmentWithAllocations,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../fulfillment/testing/fulfillment-test-utils";

export { TEST_STORE_A_ID, TEST_STORE_B_ID };

export type MemoryReturnModule = ReturnType<typeof createMemoryReturnModule>;

export async function seedFulfilledShipmentForReturns(
  module: MemoryReturnModule,
  options: {
    initialQuantity?: number;
    orderQuantity?: number;
  } = {},
) {
  const seeded = await seedPackedShipmentWithAllocations(module, options);

  await module.fulfillmentService.fulfillShipment(
    { storeId: TEST_STORE_A_ID },
    seeded.shipment.id,
  );

  const shipment = await module.shipmentRepository.findById(
    TEST_STORE_A_ID,
    seeded.shipment.id,
  );

  if (!shipment?.fulfilledAt) {
    throw new Error("Expected fulfilled shipment");
  }

  return {
    ...seeded,
    shipment,
  };
}

export function createMemoryReturnModule(
  dependencies: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const fulfillmentModule = createMemoryShipmentFulfillmentModule(dependencies);
  const returnRepository = new MemoryReturnRepository(
    fulfillmentModule.inventoryItemRepository,
  );

  return {
    ...fulfillmentModule,
    returnRepository,
    returnService: new ReturnService({
      returnRepository,
      orderRepository: fulfillmentModule.orderRepository,
      shipmentRepository: fulfillmentModule.shipmentRepository,
      inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
      ...dependencies,
    }),
  };
}

export async function seedRequestedReturn(
  module: MemoryReturnModule,
  options: {
    initialQuantity?: number;
    orderQuantity?: number;
    quantityRequested?: number;
  } = {},
) {
  const seeded = await seedFulfilledShipmentForReturns(module, options);
  const orderItem = seeded.order.items[0];

  if (!orderItem) {
    throw new Error("Expected order item");
  }

  const quantityRequested = options.quantityRequested ?? orderItem.quantity;

  const returnRecord = await module.returnService.createReturn(seeded.order.id, {
    storeId: TEST_STORE_A_ID,
    shipmentId: seeded.shipment.id,
    reason: "Wrong size",
    items: [
      {
        orderItemId: orderItem.id,
        inventoryItemId: seeded.inventoryItem.id,
        quantityRequested,
      },
    ],
  });

  return {
    ...seeded,
    returnRecord,
    orderItem,
  };
}

export async function seedInspectedReturn(
  module: MemoryReturnModule,
  options: {
    condition?: "new" | "opened" | "damaged" | "defective";
    quantityRequested?: number;
    quantityReceived?: number;
    initialQuantity?: number;
    orderQuantity?: number;
  } = {},
) {
  const { returnRecord, inventoryItem, order, shipment, orderItem } =
    await seedRequestedReturn(module, {
      quantityRequested: options.quantityRequested,
      initialQuantity: options.initialQuantity,
      orderQuantity: options.orderQuantity,
    });

  const item = returnRecord.items[0];

  if (!item) {
    throw new Error("Expected return item");
  }

  const quantityReceived =
    options.quantityReceived ?? item.quantityRequested;

  const received = await module.returnService.receiveReturn(returnRecord.id, {
    storeId: TEST_STORE_A_ID,
    items: [{ returnItemId: item.id, quantityReceived }],
  });

  const receivedItem = received.items[0];

  if (!receivedItem) {
    throw new Error("Expected received item");
  }

  const inspected = await module.returnService.inspectReturn(returnRecord.id, {
    storeId: TEST_STORE_A_ID,
    items: [
      {
        returnItemId: receivedItem.id,
        condition: options.condition ?? "new",
      },
    ],
  });

  return {
    order,
    shipment,
    orderItem,
    inventoryItem,
    returnRecord: inspected,
    returnItem: inspected.items[0]!,
  };
}
