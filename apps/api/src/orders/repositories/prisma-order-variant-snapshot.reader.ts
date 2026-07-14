import { Prisma, type PrismaClient } from "@prisma/client";

import type { OrderVariantSnapshot } from "./order-create-record";
import type { OrderVariantSnapshotReader } from "./order-variant-snapshot.reader";

export class PrismaOrderVariantSnapshotReader implements OrderVariantSnapshotReader {
  constructor(private readonly db: PrismaClient) {}

  async findVariantSnapshot(
    storeId: string,
    productVariantId: string,
  ): Promise<OrderVariantSnapshot | null> {
    const variant = await this.db.productVariant.findFirst({
      where: {
        id: productVariantId,
        storeId,
        deletedAt: null,
        product: {
          deletedAt: null,
          status: "active",
        },
      },
      include: { product: true },
    });

    if (!variant) {
      return null;
    }

    return {
      productVariantId: variant.id,
      productName: variant.product.name,
      sku: variant.sku,
      unitPrice: variant.price.toString(),
      currency: variant.currency,
    };
  }
}

export function isUniqueOrderNumberViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
