import { PrismaBrandRepository } from "./prisma-brand.repository";
import { PrismaCategoryRepository } from "./prisma-category.repository";
import { PrismaProductMediaRepository } from "./prisma-product-media.repository";
import { PrismaProductRepository } from "./prisma-product.repository";
import { PrismaProductVariantRepository } from "./prisma-product-variant.repository";
import type { BrandRepository } from "./brand.repository";
import type { CategoryRepository } from "./category.repository";
import type { ProductMediaRepository } from "./product-media.repository";
import type { ProductRepository } from "./product.repository";
import type { ProductVariantRepository } from "./product-variant.repository";
import { prisma } from "@/lib/prisma";

const brandRepository: BrandRepository = new PrismaBrandRepository(prisma);
const categoryRepository: CategoryRepository = new PrismaCategoryRepository(
  prisma,
);
const productRepository: ProductRepository = new PrismaProductRepository(
  prisma,
);
const productMediaRepository: ProductMediaRepository =
  new PrismaProductMediaRepository(prisma);
const productVariantRepository: ProductVariantRepository =
  new PrismaProductVariantRepository(prisma);

export function getBrandRepository(): BrandRepository {
  return brandRepository;
}

export function getCategoryRepository(): CategoryRepository {
  return categoryRepository;
}

export function getProductRepository(): ProductRepository {
  return productRepository;
}

export function getProductMediaRepository(): ProductMediaRepository {
  return productMediaRepository;
}

export function getProductVariantRepository(): ProductVariantRepository {
  return productVariantRepository;
}

export type { BrandRepository } from "./brand.repository";
export type { CategoryRepository } from "./category.repository";
export type { ProductMediaRepository } from "./product-media.repository";
export type { ProductRepository } from "./product.repository";
export type { ProductVariantRepository } from "./product-variant.repository";
export type {
  CreateProductMediaRecordInput,
  ProductMediaRecord,
} from "./product-media.repository";
export type {
  CreateProductVariantRecordInput,
  ProductVariantRecord,
} from "./product-variant.repository";
