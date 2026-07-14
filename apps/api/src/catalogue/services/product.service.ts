import { Prisma } from "@prisma/client";
import type { Product, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@commerceflow/validation";

import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import {
  getBrandRepository,
  getCategoryRepository,
  getProductRepository,
  type BrandRepository,
  type CategoryRepository,
  type ProductRepository,
} from "../repositories";

export interface ProductServiceDependencies {
  readonly productRepository?: ProductRepository;
  readonly categoryRepository?: CategoryRepository;
  readonly brandRepository?: BrandRepository;
}

export class ProductService {
  private readonly productRepository: ProductRepository;
  private readonly categoryRepository: CategoryRepository;
  private readonly brandRepository: BrandRepository;

  constructor(dependencies: ProductServiceDependencies = {}) {
    this.productRepository =
      dependencies.productRepository ?? getProductRepository();
    this.categoryRepository =
      dependencies.categoryRepository ?? getCategoryRepository();
    this.brandRepository =
      dependencies.brandRepository ?? getBrandRepository();
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const existing = await this.productRepository.findBySlug(
      input.storeId,
      input.slug,
    );

    if (existing) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
        "A product with this slug already exists",
        409,
      );
    }

    const category = await this.categoryRepository.findById(
      input.storeId,
      input.categoryId,
    );

    if (!category) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.CATEGORY_NOT_FOUND,
        "Category not found",
        404,
      );
    }

    if (input.brandId) {
      const brand = await this.brandRepository.findById(
        input.storeId,
        input.brandId,
      );

      if (!brand) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.BRAND_NOT_FOUND,
          "Brand not found",
          404,
        );
      }
    }

    try {
      return await this.productRepository.create(input);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SKU_ALREADY_EXISTS,
          "A variant with this SKU already exists",
          409,
        );
      }

      if (error instanceof Error && error.message.includes("Unique constraint")) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SKU_ALREADY_EXISTS,
          "A variant with this SKU already exists",
          409,
        );
      }

      throw error;
    }
  }

  async updateProduct(
    storeId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    const product = await this.productRepository.findById(storeId, id);

    if (!product) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Product not found",
        404,
      );
    }

    if (input.slug && input.slug !== product.slug) {
      const existing = await this.productRepository.findBySlug(
        storeId,
        input.slug,
      );

      if (existing) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A product with this slug already exists",
          409,
        );
      }
    }

    if (input.categoryId) {
      const category = await this.categoryRepository.findById(
        storeId,
        input.categoryId,
      );

      if (!category) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.CATEGORY_NOT_FOUND,
          "Category not found",
          404,
        );
      }
    }

    if (input.brandId) {
      const brandExists = await this.productRepository.brandExists(
        storeId,
        input.brandId,
      );

      if (!brandExists) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.BRAND_NOT_FOUND,
          "Brand not found",
          404,
        );
      }
    }

    try {
      return await this.productRepository.update(storeId, id, input);
    } catch {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Product not found",
        404,
      );
    }
  }

  async getProduct(storeId: string, id: string): Promise<Product> {
    const product = await this.productRepository.findById(storeId, id);

    if (!product) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Product not found",
        404,
      );
    }

    return product;
  }

  async listProducts(
    query: ListProductsQuery,
  ): Promise<CatalogueListResult<Product>> {
    return this.productRepository.list(query);
  }
}

export const productService = new ProductService();
