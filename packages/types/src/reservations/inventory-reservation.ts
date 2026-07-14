import type { ReservationStatus } from "./reservation-status";

/**
 * Soft reservation of on-hand stock for a confirmed order line item.
 * Does not modify physical inventory until fulfillment.
 */
export interface InventoryReservation {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly orderItemId: string;
  readonly inventoryItemId: string;
  readonly reservedQuantity: number;
  readonly status: ReservationStatus;
  readonly createdAt: string;
  readonly releasedAt?: string;
  readonly fulfilledAt?: string;
}
