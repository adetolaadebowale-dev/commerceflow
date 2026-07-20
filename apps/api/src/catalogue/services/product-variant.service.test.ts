import { describe, expect, it } from "vitest";

import { MemoryProductRepository } from "../repositories/memory-product.repository";
import { MemoryProductVariantRepository } from "../repositories/memory-product-variant.repository";
import { ProductVariantService } from "./product-variant.service";

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

describe("ProductVariantService", () => {
  it("creates, updates, lists, and blocks deleting the last variant", async () => {
    const products = new MemoryProductRepository();
    const variants = new MemoryProductVariantRepository();
    const product = await products.create({
      storeId: STORE_ID,
      name: "Tee",
      slug: "tee",
      status: "draft",
      categoryId: CATEGORY_ID,
      variants: [
        {
          sku: "TEE-DEFAULT",
          name: "Default",
          price: "10.00",
          currency: "USD",
        },
      ],
    });

    const service = new ProductVariantService({
      productRepository: products,
      productVariantRepository: variants,
    });

    // Seed repository from product create (memory product keeps its own variants).
    // Service uses dedicated variant repo, so seed the default manually.
    await variants.create({
      storeId: STORE_ID,
      productId: product.id,
      sku: "TEE-DEFAULT",
      name: "Default",
      price: "10.00",
      currency: "USD",
      attributes: { Size: "One" },
    });

    const created = await service.createProductVariant(STORE_ID, product.id, {
      sku: "TEE-XL",
      name: "Size: XL",
      price: "12.50",
      currency: "usd",
      attributes: { Size: "XL" },
    });
    expect(created.currency).toBe("USD");

    const listed = await service.listProductVariants(STORE_ID, product.id);
    expect(listed.items).toHaveLength(2);

    const updated = await service.updateProductVariant(
      STORE_ID,
      product.id,
      created.id,
      { price: "13.00" },
    );
    expect(updated.price).toBe("13.00");

    await expect(
      service.deleteProductVariant(STORE_ID, product.id, listed.items[0]!.id),
    ).resolves.toMatchObject({ id: listed.items[0]!.id });

    await expect(
      service.deleteProductVariant(STORE_ID, product.id, created.id),
    ).rejects.toMatchObject({
      code: "CATALOGUE_LAST_VARIANT_REQUIRED",
    });
  });
});
