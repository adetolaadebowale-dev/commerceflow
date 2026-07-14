import type { OrderVariantSnapshot } from "./order-create-record";

export interface OrderVariantSnapshotReader {
  findVariantSnapshot(
    storeId: string,
    productVariantId: string,
  ): Promise<OrderVariantSnapshot | null>;
}
