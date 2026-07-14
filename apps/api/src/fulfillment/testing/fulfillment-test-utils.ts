import { MemoryFulfillmentRepository } from "../repositories/memory-fulfillment.repository";
import { FulfillmentService } from "../services/fulfillment.service";
import {
  createMemoryReservationService,
  seedConfirmedOrderWithInventory,
  TEST_STORE_A_ID,
} from "../../reservations/testing/reservation-test-utils";

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

  return {
    ...reservationServices,
    fulfillmentRepository,
    fulfillmentService: new FulfillmentService({
      fulfillmentRepository,
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
