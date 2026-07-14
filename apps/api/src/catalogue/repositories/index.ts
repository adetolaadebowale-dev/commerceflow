import { PrismaCategoryRepository } from "./prisma-category.repository";
import { PrismaProductRepository } from "./prisma-product.repository";
import type { CategoryRepository } from "./category.repository";
import type { ProductRepository } from "./product.repository";
import { prisma } from "@/lib/prisma";

const categoryRepository: CategoryRepository = new PrismaCategoryRepository(
  prisma,
);
const productRepository: ProductRepository = new PrismaProductRepository(
  prisma,
);

export function getCategoryRepository(): CategoryRepository {
  return categoryRepository;
}

export function getProductRepository(): ProductRepository {
  return productRepository;
}

export type { CategoryRepository } from "./category.repository";
export type { ProductRepository } from "./product.repository";
