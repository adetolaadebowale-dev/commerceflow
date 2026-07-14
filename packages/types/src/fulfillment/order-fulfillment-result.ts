import type {
  InventoryItem,
  InventoryReservation,
  Order,
  StockMovement,
} from "@commerceflow/types";

export interface OrderFulfillmentResult {
  readonly order: Order;
  readonly reservations: readonly InventoryReservation[];
  readonly stockMovements: readonly StockMovement[];
  readonly inventoryItems: readonly InventoryItem[];
}
