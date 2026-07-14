import type { InventoryReservation } from "@commerceflow/types";

import type { CreateOrderReservationsRecord } from "./create-order-reservations-record";

export type {
  CreateOrderReservationsRecord,
  PendingReservationItem,
} from "./create-order-reservations-record";

export interface InventoryReservationRepository {
  findById(storeId: string, id: string): Promise<InventoryReservation | null>;
  listByOrderId(
    storeId: string,
    orderId: string,
  ): Promise<readonly InventoryReservation[]>;
  hasActiveReservationsForOrder(
    storeId: string,
    orderId: string,
  ): Promise<boolean>;
  getActiveReservedQuantity(
    storeId: string,
    inventoryItemId: string,
  ): Promise<number>;
  createForOrder(
    record: CreateOrderReservationsRecord,
  ): Promise<readonly InventoryReservation[]>;
  release(storeId: string, id: string): Promise<InventoryReservation>;
}
