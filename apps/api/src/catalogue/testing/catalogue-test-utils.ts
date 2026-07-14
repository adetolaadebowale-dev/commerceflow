import type {
  Category,
  Product,
  CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateCategoryInput,
  CreateProductInput,
  ListCategoriesQuery,
  ListProductsQuery,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@commerceflow/validation";

import { MemoryCategoryRepository } from "../repositories/memory-category.repository";
import { MemoryProductRepository } from "../repositories/memory-product.repository";
import { CategoryService } from "../services/category.service";
import { ProductService } from "../services/product.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryCatalogueServices(): {
  categoryService: CategoryService;
  productService: ProductService;
  categoryRepository: MemoryCategoryRepository;
  productRepository: MemoryProductRepository;
} {
  const categoryRepository = new MemoryCategoryRepository();
  const productRepository = new MemoryProductRepository();

  return {
    categoryRepository,
    productRepository,
    categoryService: new CategoryService({ categoryRepository }),
    productService: new ProductService({
      categoryRepository,
      productRepository,
    }),
  };
}

export function validCategoryInput(
  overrides: Partial<CreateCategoryInput> = {},
): CreateCategoryInput {
  const suffix = crypto.randomUUID().slice(0, 8);

  return {
    storeId: TEST_STORE_A_ID,
    name: "Accessories",
    slug: `accessories-${suffix}`,
    description: "Accessory products",
    ...overrides,
  };
}

export function validProductInput(
  categoryId: string,
  overrides: Partial<CreateProductInput> = {},
): CreateProductInput {
  const suffix = crypto.randomUUID().slice(0, 8);

  return {
    storeId: TEST_STORE_A_ID,
    name: "Classic Tee",
    slug: `classic-tee-${suffix}`,
    description: "A comfortable cotton tee",
    status: "draft",
    categoryId,
    variants: [
      {
        sku: `SKU-${suffix}`,
        name: "Default",
        price: "19.99",
        currency: "USD",
      },
    ],
    ...overrides,
  };
}

export type {
  Category,
  Product,
  CatalogueListResult,
  CreateCategoryInput,
  CreateProductInput,
  ListCategoriesQuery,
  ListProductsQuery,
  UpdateCategoryInput,
  UpdateProductInput,
};
