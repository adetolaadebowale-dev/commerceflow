/**
 * Current on-hand stock for a product variant within a store.
 */
export interface InventoryItem {
  readonly id: string;
  readonly storeId: string;
  readonly warehouseId: string;
  readonly productVariantId: string;
  readonly quantityOnHand: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
