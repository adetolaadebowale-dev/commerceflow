export interface PendingReservationItem {
  readonly orderItemId: string;
  readonly inventoryItemId: string;
  readonly reservedQuantity: number;
}

export interface CreateOrderReservationsRecord {
  readonly storeId: string;
  readonly orderId: string;
  readonly items: readonly PendingReservationItem[];
}
