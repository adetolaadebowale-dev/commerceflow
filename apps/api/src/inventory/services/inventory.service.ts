import { Prisma } from "@prisma/client";
import type {
  CatalogueListResult,
  InventoryItem,
  StockMovement,
} from "@commerceflow/types";
import type {
  CreateInventoryItemInput,
  CreateStockMovementInput,
  ListInventoryItemsQuery,
  ListStockMovementsQuery,
} from "@commerceflow/validation";

import { INVENTORY_ERROR_CODES, InventoryError } from "../errors";
import {
  getInventoryItemRepository,
  getStockMovementRepository,
  type InventoryAdjustmentResult,
  type InventoryItemRepository,
  type StockMovementRepository,
} from "../repositories";

export interface InventoryServiceDependencies {
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly stockMovementRepository?: StockMovementRepository;
}

export class InventoryService {
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly stockMovementRepository: StockMovementRepository;

  constructor(dependencies: InventoryServiceDependencies = {}) {
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.stockMovementRepository =
      dependencies.stockMovementRepository ?? getStockMovementRepository();
  }

  async createInventoryItem(
    input: CreateInventoryItemInput,
  ): Promise<InventoryAdjustmentResult> {
    const variantExists = await this.inventoryItemRepository.productVariantExists(
      input.storeId,
      input.productVariantId,
    );

    if (!variantExists) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.VARIANT_NOT_FOUND,
        "Product variant not found",
        404,
      );
    }

    const existing = await this.inventoryItemRepository.findByProductVariantId(
      input.storeId,
      input.productVariantId,
    );

    if (existing) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.ALREADY_EXISTS,
        "Inventory already exists for this product variant",
        409,
      );
    }

    try {
      return await this.inventoryItemRepository.createWithInitialMovement(input);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new InventoryError(
          INVENTORY_ERROR_CODES.ALREADY_EXISTS,
          "Inventory already exists for this product variant",
          409,
        );
      }

      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        throw new InventoryError(
          INVENTORY_ERROR_CODES.ALREADY_EXISTS,
          "Inventory already exists for this product variant",
          409,
        );
      }

      throw error;
    }
  }

  async adjustStock(
    input: CreateStockMovementInput,
  ): Promise<InventoryAdjustmentResult> {
    try {
      return await this.inventoryItemRepository.adjustStock(input);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "INSUFFICIENT_STOCK") {
          throw new InventoryError(
            INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK,
            "Stock quantity cannot become negative",
            409,
          );
        }

        if (error.message.startsWith("InventoryItem not found:")) {
          throw new InventoryError(
            INVENTORY_ERROR_CODES.NOT_FOUND,
            "Inventory item not found",
            404,
          );
        }
      }

      throw error;
    }
  }

  async getInventoryItem(
    storeId: string,
    id: string,
  ): Promise<InventoryItem> {
    const item = await this.inventoryItemRepository.findById(storeId, id);

    if (!item) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.NOT_FOUND,
        "Inventory item not found",
        404,
      );
    }

    return item;
  }

  async listInventoryItems(
    query: ListInventoryItemsQuery,
  ): Promise<CatalogueListResult<InventoryItem>> {
    return this.inventoryItemRepository.list(query);
  }

  async listStockMovements(
    query: ListStockMovementsQuery,
  ): Promise<CatalogueListResult<StockMovement>> {
    return this.stockMovementRepository.list(query);
  }
}

export const inventoryService = new InventoryService();
