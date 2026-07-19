import { describe, expect, it } from "vitest";

import type { Brand, Category, Product } from "@commerceflow/types";

import {
  formatProductPrice,
  mapProductToListRow,
} from "@/features/products/product-list-mappers";

const product: Product = {
  id: "33333333-3333-4333-8333-333333333301",
  storeId: "11111111-1111-1111-1111-111111111111",
  name: "Classic Tee",
  slug: "classic-tee",
  status: "active",
  categoryId: "22222222-2222-4222-8222-222222222202",
  brandId: "22222222-2222-4222-8222-222222222201",
  variants: [
    {
      id: "variant-1",
      productId: "33333333-3333-4333-8333-333333333301",
      sku: "TEE-001",
      name: "Default",
      price: "29.00",
      currency: "USD",
      createdAt: "2026-07-18T10:00:00.000Z",
      updatedAt: "2026-07-18T10:00:00.000Z",
    },
  ],
  createdAt: "2026-07-18T10:00:00.000Z",
  updatedAt: "2026-07-18T12:00:00.000Z",
};

describe("product list mappers", () => {
  it("formats a single variant price", () => {
    expect(formatProductPrice(product)).toMatch(/\$29\.00/);
  });

  it("formats a price range across variants", () => {
    const ranged: Product = {
      ...product,
      variants: [
        product.variants[0]!,
        {
          ...product.variants[0]!,
          id: "variant-2",
          sku: "TEE-002",
          price: "39.00",
        },
      ],
    };

    expect(formatProductPrice(ranged)).toContain("–");
  });

  it("maps brand and category names from lookup maps", () => {
    const brands = new Map<string, Brand>([
      [
        "22222222-2222-4222-8222-222222222201",
        {
          id: "22222222-2222-4222-8222-222222222201",
          storeId: product.storeId,
          name: "Northwind Apparel",
          slug: "northwind-apparel",
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      ],
    ]);
    const categories = new Map<string, Category>([
      [
        "22222222-2222-4222-8222-222222222202",
        {
          id: "22222222-2222-4222-8222-222222222202",
          storeId: product.storeId,
          name: "T-Shirts",
          slug: "t-shirts",
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      ],
    ]);

    const row = mapProductToListRow(product, brands, categories);

    expect(row).toMatchObject({
      name: "Classic Tee",
      brand: "Northwind Apparel",
      category: "T-Shirts",
      status: "active",
    });
  });
});
