import type {
  Brand,
  Category,
  Product,
  CatalogueListResult,
} from "@commerceflow/types";
import type {
  CreateBrandInput,
  CreateCategoryInput,
  CreateProductInput,
  ListBrandsQuery,
  ListCategoriesQuery,
  ListProductsQuery,
  UpdateBrandInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from "@commerceflow/validation";

import { MemoryBrandRepository } from "../repositories/memory-brand.repository";
import { MemoryCategoryRepository } from "../repositories/memory-category.repository";
import { MemoryProductRepository } from "../repositories/memory-product.repository";
import { BrandService } from "../services/brand.service";
import { CategoryService } from "../services/category.service";
import { ProductService } from "../services/product.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";

export function createMemoryBrandService(): {
  brandService: BrandService;
  brandRepository: MemoryBrandRepository;
} {
  const brandRepository = new MemoryBrandRepository();

  return {
    brandRepository,
    brandService: new BrandService({ brandRepository }),
  };
}

export function createMemoryCatalogueServices(): {
  brandService: BrandService;
  categoryService: CategoryService;
  productService: ProductService;
  brandRepository: MemoryBrandRepository;
  categoryRepository: MemoryCategoryRepository;
  productRepository: MemoryProductRepository;
} {
  const brandRepository = new MemoryBrandRepository();
  const categoryRepository = new MemoryCategoryRepository();
  const productRepository = new MemoryProductRepository();

  return {
    brandRepository,
    categoryRepository,
    productRepository,
    brandService: new BrandService({ brandRepository }),
    categoryService: new CategoryService({ categoryRepository }),
    productService: new ProductService({
      brandRepository,
      categoryRepository,
      productRepository,
    }),
  };
}

export function validBrandInput(
  overrides: Partial<CreateBrandInput> = {},
): CreateBrandInput {
  const suffix = crypto.randomUUID().slice(0, 8);

  return {
    storeId: TEST_STORE_A_ID,
    name: "Acme",
    slug: `acme-${suffix}`,
    description: "Acme brand",
    ...overrides,
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
  Brand,
  Category,
  Product,
  CatalogueListResult,
  CreateBrandInput,
  CreateCategoryInput,
  CreateProductInput,
  ListBrandsQuery,
  ListCategoriesQuery,
  ListProductsQuery,
  UpdateBrandInput,
  UpdateCategoryInput,
  UpdateProductInput,
};
