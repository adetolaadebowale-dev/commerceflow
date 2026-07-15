import { Prisma } from "@prisma/client";
import type {
  AcceptReplenishmentRecommendationResult,
  ReplenishmentRecommendation,
  ReplenishmentRule,
} from "@commerceflow/types";
import type {
  AcceptReplenishmentRecommendationInput,
  CreateReplenishmentRuleInput,
  GenerateReplenishmentRecommendationsInput,
  ListReplenishmentRecommendationsQuery,
  ListReplenishmentRulesQuery,
  UpdateReplenishmentRuleInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getInventoryItemRepository,
  type InventoryItemRepository,
} from "@/inventory/repositories";
import { generatePurchaseOrderNumber } from "@/purchase-orders/services/purchase-order-number";
import {
  getSupplierRepository,
  type SupplierRepository,
} from "@/suppliers/repositories";
import {
  getWarehouseRepository,
  type WarehouseRepository,
} from "@/warehouses/repositories";
import { REPLENISHMENT_ERROR_CODES, ReplenishmentError } from "../errors";
import {
  getReplenishmentRepository,
  type ReplenishmentRepository,
} from "../repositories";

export interface ReplenishmentServiceDependencies {
  readonly replenishmentRepository?: ReplenishmentRepository;
  readonly warehouseRepository?: WarehouseRepository;
  readonly supplierRepository?: SupplierRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class ReplenishmentService {
  private readonly replenishmentRepository: ReplenishmentRepository;
  private readonly warehouseRepository: WarehouseRepository;
  private readonly supplierRepository: SupplierRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: ReplenishmentServiceDependencies = {}) {
    this.replenishmentRepository =
      dependencies.replenishmentRepository ?? getReplenishmentRepository();
    this.warehouseRepository =
      dependencies.warehouseRepository ?? getWarehouseRepository();
    this.supplierRepository =
      dependencies.supplierRepository ?? getSupplierRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createRule(input: CreateReplenishmentRuleInput): Promise<ReplenishmentRule> {
    await this.requireActiveWarehouse(input.storeId, input.warehouseId);
    await this.requireActiveSupplier(input.storeId, input.supplierId);
    await this.requireProductVariant(input.storeId, input.productVariantId);

    try {
      const rule = await this.replenishmentRepository.createRule(input);
      this.domainEventPublisher.publishReplenishmentRuleCreated(rule);
      return rule;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateRule(
    storeId: string,
    id: string,
    input: UpdateReplenishmentRuleInput,
  ): Promise<ReplenishmentRule> {
    if (input.supplierId !== undefined) {
      await this.requireActiveSupplier(storeId, input.supplierId);
    }

    try {
      const rule = await this.replenishmentRepository.updateRule(
        storeId,
        id,
        input,
      );
      this.domainEventPublisher.publishReplenishmentRuleUpdated(rule);
      return rule;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getRule(storeId: string, id: string): Promise<ReplenishmentRule> {
    const rule = await this.replenishmentRepository.findRuleById(storeId, id);

    if (!rule) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.RULE_NOT_FOUND,
        "Replenishment rule not found",
        404,
      );
    }

    return rule;
  }

  async listRules(query: ListReplenishmentRulesQuery) {
    return this.replenishmentRepository.listRules(query);
  }

  async deleteRule(storeId: string, id: string): Promise<ReplenishmentRule> {
    try {
      const rule = await this.replenishmentRepository.deleteRule(storeId, id);
      this.domainEventPublisher.publishReplenishmentRuleDeleted(rule);
      return rule;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async generateRecommendations(
    input: GenerateReplenishmentRecommendationsInput,
  ): Promise<ReplenishmentRecommendation[]> {
    try {
      const recommendations =
        await this.replenishmentRepository.generateRecommendations(input);

      for (const recommendation of recommendations) {
        this.domainEventPublisher.publishReplenishmentRecommendationGenerated(
          recommendation,
        );
      }

      return recommendations;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getRecommendation(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation> {
    const recommendation =
      await this.replenishmentRepository.findRecommendationById(storeId, id);

    if (!recommendation) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.RECOMMENDATION_NOT_FOUND,
        "Replenishment recommendation not found",
        404,
      );
    }

    return recommendation;
  }

  async listRecommendations(query: ListReplenishmentRecommendationsQuery) {
    return this.replenishmentRepository.listRecommendations(query);
  }

  async acceptRecommendation(
    id: string,
    input: AcceptReplenishmentRecommendationInput,
  ): Promise<AcceptReplenishmentRecommendationResult> {
    const existing = await this.getRecommendation(input.storeId, id);

    await this.requireActiveWarehouse(input.storeId, existing.warehouseId);
    await this.requireActiveSupplier(input.storeId, existing.supplierId);

    try {
      const result = await this.replenishmentRepository.acceptRecommendation(
        input.storeId,
        id,
        input,
        generatePurchaseOrderNumber(),
      );

      this.domainEventPublisher.publishReplenishmentRecommendationAccepted(
        result,
      );

      if (result.purchaseOrderCreated) {
        this.domainEventPublisher.publishPurchaseOrderCreated(
          result.purchaseOrder,
        );
      }

      return result;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async dismissRecommendation(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation> {
    try {
      const recommendation =
        await this.replenishmentRepository.dismissRecommendation(storeId, id);
      this.domainEventPublisher.publishReplenishmentRecommendationDismissed(
        recommendation,
      );
      return recommendation;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async requireActiveWarehouse(
    storeId: string,
    warehouseId: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepository.findById(
      storeId,
      warehouseId,
    );

    if (!warehouse) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Warehouse not found",
        404,
      );
    }

    if (warehouse.status !== "active") {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Warehouse must be active",
        400,
      );
    }
  }

  private async requireActiveSupplier(
    storeId: string,
    supplierId: string,
  ): Promise<void> {
    const supplier = await this.supplierRepository.findById(storeId, supplierId);

    if (!supplier) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Supplier not found",
        404,
      );
    }

    if (supplier.status !== "active") {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Supplier must be active",
        400,
      );
    }
  }

  private async requireProductVariant(
    storeId: string,
    productVariantId: string,
  ): Promise<void> {
    const exists = await this.inventoryItemRepository.productVariantExists(
      storeId,
      productVariantId,
    );

    if (!exists) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Product variant not found",
        404,
      );
    }
  }

  private mapRepositoryError(error: unknown): ReplenishmentError {
    if (
      error instanceof Error &&
      error.message.startsWith("Replenishment rule not found:")
    ) {
      return new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.RULE_NOT_FOUND,
        "Replenishment rule not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Replenishment recommendation not found:")
    ) {
      return new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.RECOMMENDATION_NOT_FOUND,
        "Replenishment recommendation not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Replenishment rule already exists:")
    ) {
      return new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.RULE_ALREADY_EXISTS,
        "Replenishment rule already exists for this warehouse and product variant",
        409,
      );
    }

    if (error instanceof Error && error.message === "INVALID_RECOMMENDATION_STATUS") {
      return new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.INVALID_RECOMMENDATION_STATUS,
        "Replenishment recommendation is not pending",
        409,
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.RULE_ALREADY_EXISTS,
        "Replenishment rule already exists for this warehouse and product variant",
        409,
      );
    }

    if (error instanceof ReplenishmentError) {
      return error;
    }

    return new ReplenishmentError(
      REPLENISHMENT_ERROR_CODES.TRANSACTION_FAILED,
      "Replenishment transaction failed",
      500,
    );
  }
}

export const replenishmentService = new ReplenishmentService();
