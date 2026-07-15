import type { StockMovement } from "../stock-movement/stock-movement";
import type { PurchaseOrderStatus } from "./purchase-order-status";

/** Line item on a purchase order. */
export interface PurchaseOrderItem {
  readonly id: string;
  readonly purchaseOrderId: string;
  readonly productVariantId: string;
  readonly quantityOrdered: number;
  readonly quantityReceived: number;
  readonly unitCost: string;
  readonly currency: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Store-scoped supplier purchase order for inbound procurement. */
export interface PurchaseOrder {
  readonly id: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly supplierId: string;
  readonly purchaseOrderNumber: string;
  readonly status: PurchaseOrderStatus;
  readonly orderedAt?: string;
  readonly receivedAt?: string;
  readonly expectedDeliveryDate?: string;
  readonly notes?: string;
  readonly items: readonly PurchaseOrderItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Result of receiving inventory against a purchase order. */
export interface PurchaseOrderReceiveResult {
  readonly purchaseOrder: PurchaseOrder;
  readonly stockMovements: readonly StockMovement[];
}
