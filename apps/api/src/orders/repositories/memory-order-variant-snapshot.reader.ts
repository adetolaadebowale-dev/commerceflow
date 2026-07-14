import type { OrderVariantSnapshot } from "./order-create-record";
import type { OrderVariantSnapshotReader } from "./order-variant-snapshot.reader";

interface SeededVariant extends OrderVariantSnapshot {
  readonly storeId: string;
  readonly isActive: boolean;
}

export class MemoryOrderVariantSnapshotReader implements OrderVariantSnapshotReader {
  private readonly variantsById = new Map<string, SeededVariant>();

  seedVariant(variant: SeededVariant): void {
    this.variantsById.set(variant.productVariantId, variant);
  }

  updateSeededVariant(
    productVariantId: string,
    updates: Partial<
      Pick<OrderVariantSnapshot, "productName" | "sku" | "unitPrice" | "currency">
    >,
  ): void {
    const existing = this.variantsById.get(productVariantId);

    if (!existing) {
      return;
    }

    this.variantsById.set(productVariantId, {
      ...existing,
      ...updates,
    });
  }

  deactivateVariant(productVariantId: string): void {
    const existing = this.variantsById.get(productVariantId);

    if (existing) {
      this.variantsById.set(productVariantId, { ...existing, isActive: false });
    }
  }

  async findVariantSnapshot(
    storeId: string,
    productVariantId: string,
  ): Promise<OrderVariantSnapshot | null> {
    const variant = this.variantsById.get(productVariantId);

    if (!variant || variant.storeId !== storeId || !variant.isActive) {
      return null;
    }

    return {
      productVariantId: variant.productVariantId,
      productName: variant.productName,
      sku: variant.sku,
      unitPrice: variant.unitPrice,
      currency: variant.currency,
    };
  }
}

export type { SeededVariant };
