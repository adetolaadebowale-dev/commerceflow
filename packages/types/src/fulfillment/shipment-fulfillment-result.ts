import type {
  InventoryAllocation,
  InventoryItem,
  Shipment,
  StockMovement,
} from "@commerceflow/types";

/** Result of warehouse shipment fulfillment with stock deductions. */
export interface ShipmentFulfillmentResult {
  readonly shipment: Shipment;
  readonly stockMovements: readonly StockMovement[];
  readonly inventoryItems: readonly InventoryItem[];
  readonly allocations: readonly InventoryAllocation[];
}
