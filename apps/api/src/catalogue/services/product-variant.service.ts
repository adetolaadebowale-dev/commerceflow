import type {
  ProductVariant,
  ProductVariantListResponse,
} from "@commerceflow/types";
import {
  createProductVariantSchema,
  updateProductVariantSchema,
  type CreateProductVariantInput,
  type UpdateProductVariantInput,
} from "@commerceflow/validation";

import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import {
  getProductRepository,
  getProductVariantRepository,
  type ProductRepository,
  type ProductVariantRecord,
  type ProductVariantRepository,
} from "../repositories";

export interface ProductVariantServiceDependencies {
  readonly productRepository?: ProductRepository;
  readonly productVariantRepository?: ProductVariantRepository;
}

function toValidationError(error: unknown): CatalogueError | null {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof (error as { flatten: unknown }).flatten === "function"
  ) {
    return new CatalogueError(
      CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      (error as { flatten: () => unknown }).flatten(),
    );
  }
  return null;
}

function isSkuConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  if ((error as { code?: string }).code === "P2002") {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  return error.message.toLowerCase().includes("unique constraint");
}

export class ProductVariantService {
  private readonly productRepository: ProductRepository;
  private readonly productVariantRepository: ProductVariantRepository;

  constructor(dependencies: ProductVariantServiceDependencies = {}) {
    this.productRepository =
      dependencies.productRepository ?? getProductRepository();
    this.productVariantRepository =
      dependencies.productVariantRepository ?? getProductVariantRepository();
  }

  async listProductVariants(
    storeId: string,
    productId: string,
  ): Promise<ProductVariantListResponse> {
    await this.ensureProductExists(storeId, productId);
    const records = await this.productVariantRepository.listByProductId(
      storeId,
      productId,
    );
    return { items: records.map((record) => this.toProductVariant(record)) };
  }

  async createProductVariant(
    storeId: string,
    productId: string,
    input: CreateProductVariantInput,
  ): Promise<ProductVariant> {
    await this.ensureProductExists(storeId, productId);

    let parsed: CreateProductVariantInput;
    try {
      parsed = createProductVariantSchema.parse(input);
    } catch (error) {
      const validationError = toValidationError(error);
      if (validationError) {
        throw validationError;
      }
      throw error;
    }

    try {
      const record = await this.productVariantRepository.create({
        storeId,
        productId,
        ...parsed,
      });
      return this.toProductVariant(record);
    } catch (error) {
      if (isSkuConflict(error)) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SKU_ALREADY_EXISTS,
          "A variant with this SKU already exists",
          409,
        );
      }
      throw error;
    }
  }

  async updateProductVariant(
    storeId: string,
    productId: string,
    variantId: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariant> {
    await this.ensureProductExists(storeId, productId);

    let parsed: UpdateProductVariantInput;
    try {
      parsed = updateProductVariantSchema.parse(input);
    } catch (error) {
      const validationError = toValidationError(error);
      if (validationError) {
        throw validationError;
      }
      throw error;
    }

    const existing = await this.productVariantRepository.findById(
      storeId,
      productId,
      variantId,
    );
    if (!existing) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.PRODUCT_VARIANT_NOT_FOUND,
        "Product variant not found",
        404,
      );
    }

    try {
      const record = await this.productVariantRepository.update(
        storeId,
        productId,
        variantId,
        parsed,
      );
      return this.toProductVariant(record);
    } catch (error) {
      if (isSkuConflict(error)) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SKU_ALREADY_EXISTS,
          "A variant with this SKU already exists",
          409,
        );
      }
      throw error;
    }
  }

  async deleteProductVariant(
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<ProductVariant> {
    await this.ensureProductExists(storeId, productId);

    const existing = await this.productVariantRepository.findById(
      storeId,
      productId,
      variantId,
    );
    if (!existing) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.PRODUCT_VARIANT_NOT_FOUND,
        "Product variant not found",
        404,
      );
    }

    const count = await this.productVariantRepository.countByProductId(
      storeId,
      productId,
    );
    if (count <= 1) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.LAST_VARIANT_REQUIRED,
        "Cannot delete the last variant for a product",
        409,
      );
    }

    const record = await this.productVariantRepository.softDelete(
      storeId,
      productId,
      variantId,
    );
    return this.toProductVariant(record);
  }

  private async ensureProductExists(
    storeId: string,
    productId: string,
  ): Promise<void> {
    const product = await this.productRepository.findById(storeId, productId);
    if (!product) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Product not found",
        404,
      );
    }
  }

  private toProductVariant(record: ProductVariantRecord): ProductVariant {
    return {
      id: record.id,
      productId: record.productId,
      sku: record.sku,
      name: record.name,
      price: record.price,
      currency: record.currency,
      ...(record.attributes ? { attributes: record.attributes } : {}),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const productVariantService = new ProductVariantService();
