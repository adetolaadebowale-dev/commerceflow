import { Prisma } from "@prisma/client";
import type { Brand, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateBrandInput,
  ListBrandsQuery,
  UpdateBrandInput,
} from "@commerceflow/validation";

import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import {
  getBrandRepository,
  type BrandRepository,
} from "../repositories";

export interface BrandServiceDependencies {
  readonly brandRepository?: BrandRepository;
}

export class BrandService {
  private readonly brandRepository: BrandRepository;

  constructor(dependencies: BrandServiceDependencies = {}) {
    this.brandRepository =
      dependencies.brandRepository ?? getBrandRepository();
  }

  async createBrand(input: CreateBrandInput): Promise<Brand> {
    const existing = await this.brandRepository.findBySlug(
      input.storeId,
      input.slug,
    );

    if (existing) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
        "A brand with this slug already exists",
        409,
      );
    }

    try {
      return await this.brandRepository.create(input);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A brand with this slug already exists",
          409,
        );
      }

      throw error;
    }
  }

  async updateBrand(
    storeId: string,
    id: string,
    input: UpdateBrandInput,
  ): Promise<Brand> {
    const brand = await this.brandRepository.findById(storeId, id);

    if (!brand) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Brand not found",
        404,
      );
    }

    if (input.slug && input.slug !== brand.slug) {
      const existing = await this.brandRepository.findBySlug(
        storeId,
        input.slug,
      );

      if (existing) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A brand with this slug already exists",
          409,
        );
      }
    }

    try {
      return await this.brandRepository.update(storeId, id, input);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.SLUG_ALREADY_EXISTS,
          "A brand with this slug already exists",
          409,
        );
      }

      if (error instanceof Error && error.message.startsWith("Brand not found:")) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.NOT_FOUND,
          "Brand not found",
          404,
        );
      }

      throw error;
    }
  }

  async getBrand(storeId: string, id: string): Promise<Brand> {
    const brand = await this.brandRepository.findById(storeId, id);

    if (!brand) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.NOT_FOUND,
        "Brand not found",
        404,
      );
    }

    return brand;
  }

  async listBrands(
    query: ListBrandsQuery,
  ): Promise<CatalogueListResult<Brand>> {
    return this.brandRepository.list(query);
  }

  async deleteBrand(storeId: string, id: string): Promise<Brand> {
    try {
      return await this.brandRepository.softDelete(storeId, id);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Brand not found:")) {
        throw new CatalogueError(
          CATALOGUE_ERROR_CODES.NOT_FOUND,
          "Brand not found",
          404,
        );
      }

      throw error;
    }
  }
}

export const brandService = new BrandService();
