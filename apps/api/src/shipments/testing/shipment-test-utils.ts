import type { CreateShipmentInput } from "@commerceflow/validation";

import type { DomainEventPublisher } from "@/domain-events";
import {
  createMemoryFulfillmentService,
  seedConfirmedReservedOrder,
  TEST_STORE_A_ID,
} from "@/fulfillment/testing/fulfillment-test-utils";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import type { ShipmentCarrierGatewayFactory } from "../gateways";
import { MemoryShipmentRepository } from "../repositories/memory-shipment.repository";
import { ShipmentService } from "../services/shipment.service";

export { TEST_STORE_A_ID, TEST_STORE_B_ID } from "@/fulfillment/testing/fulfillment-test-utils";

export const TEST_SHIPPING_ADDRESS = {
  recipientName: "Jane Doe",
  phone: "+15551234567",
  addressLine1: "123 Main St",
  addressLine2: "Apt 4B",
  city: "Springfield",
  stateProvince: "IL",
  postalCode: "62701",
  countryCode: "US",
} as const;

export function createMemoryShipmentModule(dependencies: {
  domainEventPublisher?: DomainEventPublisher;
  shipmentCarrierGatewayFactory?: ShipmentCarrierGatewayFactory;
} = {}) {
  const fulfillmentServices = createMemoryFulfillmentService();
  const shipmentRepository = new MemoryShipmentRepository();

  return {
    ...fulfillmentServices,
    shipmentRepository,
    shipmentService: new ShipmentService({
      shipmentRepository,
      orderRepository: fulfillmentServices.orderRepository,
      ...dependencies,
    }),
  };
}

export function validShipmentInput(
  overrides: Partial<CreateShipmentInput> = {},
): CreateShipmentInput {
  return {
    carrier: "internal",
    ...overrides,
  };
}

export async function seedFulfilledOrderWithShipping(
  module: ReturnType<typeof createMemoryShipmentModule>,
) {
  const { confirmed, inventoryItem } = await seedConfirmedReservedOrder(module);

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

  return { order, inventoryItem };
}

export async function createPendingShipment(
  module: ReturnType<typeof createMemoryShipmentModule>,
) {
  const { order } = await seedFulfilledOrderWithShipping(module);
  const shipment = await module.shipmentService.createShipment(
    TEST_STORE_A_ID,
    order.id,
    validShipmentInput(),
  );

  return { order, shipment };
}

export async function createPackedShipment(
  module: ReturnType<typeof createMemoryShipmentModule>,
) {
  const { order, shipment } = await createPendingShipment(module);
  const packed = await module.shipmentService.packShipment(
    { storeId: TEST_STORE_A_ID },
    shipment.id,
  );

  return { order, shipment: packed };
}

export async function createShippedShipment(
  module: ReturnType<typeof createMemoryShipmentModule>,
) {
  const { order, shipment } = await createPackedShipment(module);
  const shipped = await module.shipmentService.shipShipment(
    { storeId: TEST_STORE_A_ID },
    shipment.id,
  );

  return { order, shipment: shipped };
}
