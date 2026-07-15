import {
  buildCatalogueListResult,
  type AcceptReplenishmentRecommendationResult,
  type ReplenishmentRecommendation,
  type ReplenishmentRule,
} from "@commerceflow/types";
import type {
  AcceptReplenishmentRecommendationInput,
  CreateReplenishmentRuleInput,
  GenerateReplenishmentRecommendationsInput,
  ListReplenishmentRecommendationsQuery,
  ListReplenishmentRulesQuery,
  UpdateReplenishmentRuleInput,
} from "@commerceflow/validation";

import type { InventoryItemRepository } from "@/inventory/repositories/inventory-item.repository";
import type { PurchaseOrderRepository } from "@/purchase-orders/repositories/purchase-order.repository";
import type { ReplenishmentRepository } from "./replenishment.repository";

function toRecommendation(
  record: ReplenishmentRecommendation,
): ReplenishmentRecommendation {
  return { ...record };
}

function toRule(record: ReplenishmentRule): ReplenishmentRule {
  return { ...record };
}

export class MemoryReplenishmentRepository implements ReplenishmentRepository {
  private readonly rulesById = new Map<string, ReplenishmentRule>();
  private readonly recommendationsById = new Map<
    string,
    ReplenishmentRecommendation
  >();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async findRuleById(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRule | null> {
    const rule = this.rulesById.get(id);
    return rule?.storeId === storeId ? toRule(rule) : null;
  }

  async listRules(query: ListReplenishmentRulesQuery) {
    let items = [...this.rulesById.values()].filter(
      (rule) => rule.storeId === query.storeId,
    );

    if (query.warehouseId) {
      items = items.filter((rule) => rule.warehouseId === query.warehouseId);
    }

    if (query.isEnabled !== undefined) {
      items = items.filter((rule) => rule.isEnabled === query.isEnabled);
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit).map(toRule),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createRule(input: CreateReplenishmentRuleInput): Promise<ReplenishmentRule> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    await this.assertRuleAvailable(
      input.storeId,
      input.warehouseId,
      input.productVariantId,
    );

    const now = new Date().toISOString();
    const rule: ReplenishmentRule = {
      id: crypto.randomUUID(),
      storeId: input.storeId,
      warehouseId: input.warehouseId,
      productVariantId: input.productVariantId,
      supplierId: input.supplierId,
      reorderPoint: input.reorderPoint,
      reorderQuantity: input.reorderQuantity,
      minimumQuantity: input.minimumQuantity,
      maximumQuantity: input.maximumQuantity,
      isEnabled: input.isEnabled,
      createdAt: now,
      updatedAt: now,
    };

    this.rulesById.set(rule.id, rule);
    return toRule(rule);
  }

  async updateRule(
    storeId: string,
    id: string,
    input: UpdateReplenishmentRuleInput,
  ): Promise<ReplenishmentRule> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findRuleById(storeId, id);
    if (!existing) {
      throw new Error(`Replenishment rule not found: ${id}`);
    }

    const updated: ReplenishmentRule = {
      ...existing,
      ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
      ...(input.reorderPoint !== undefined
        ? { reorderPoint: input.reorderPoint }
        : {}),
      ...(input.reorderQuantity !== undefined
        ? { reorderQuantity: input.reorderQuantity }
        : {}),
      ...(input.minimumQuantity !== undefined
        ? { minimumQuantity: input.minimumQuantity }
        : {}),
      ...(input.maximumQuantity !== undefined
        ? { maximumQuantity: input.maximumQuantity }
        : {}),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      updatedAt: new Date().toISOString(),
    };

    this.rulesById.set(id, updated);
    return toRule(updated);
  }

  async deleteRule(storeId: string, id: string): Promise<ReplenishmentRule> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findRuleById(storeId, id);
    if (!existing) {
      throw new Error(`Replenishment rule not found: ${id}`);
    }

    this.rulesById.delete(id);
    return toRule(existing);
  }

  async findRecommendationById(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation | null> {
    const recommendation = this.recommendationsById.get(id);
    return recommendation?.storeId === storeId
      ? toRecommendation(recommendation)
      : null;
  }

  async listRecommendations(query: ListReplenishmentRecommendationsQuery) {
    let items = [...this.recommendationsById.values()].filter(
      (recommendation) => recommendation.storeId === query.storeId,
    );

    if (query.warehouseId) {
      items = items.filter(
        (recommendation) => recommendation.warehouseId === query.warehouseId,
      );
    }

    if (query.status) {
      items = items.filter(
        (recommendation) => recommendation.status === query.status,
      );
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;

    return buildCatalogueListResult({
      items: items.slice(start, start + query.limit).map(toRecommendation),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async generateRecommendations(
    input: GenerateReplenishmentRecommendationsInput,
  ): Promise<ReplenishmentRecommendation[]> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const created: ReplenishmentRecommendation[] = [];
    const rules = [...this.rulesById.values()].filter(
      (rule) =>
        rule.storeId === input.storeId &&
        rule.isEnabled &&
        (input.warehouseId === undefined ||
          rule.warehouseId === input.warehouseId),
    );

    for (const rule of rules) {
      const pending = await this.findPendingRecommendation(
        input.storeId,
        rule.warehouseId,
        rule.productVariantId,
      );

      if (pending) {
        continue;
      }

      const inventoryItem =
        await this.inventoryItemRepository.findByProductVariantId(
          input.storeId,
          rule.warehouseId,
          rule.productVariantId,
        );
      const currentQuantity = inventoryItem?.quantityOnHand ?? 0;

      if (currentQuantity >= rule.reorderPoint) {
        continue;
      }

      const now = new Date().toISOString();
      const recommendation: ReplenishmentRecommendation = {
        id: crypto.randomUUID(),
        storeId: rule.storeId,
        warehouseId: rule.warehouseId,
        supplierId: rule.supplierId,
        productVariantId: rule.productVariantId,
        recommendedQuantity: rule.reorderQuantity,
        currentQuantity,
        reorderPoint: rule.reorderPoint,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      this.recommendationsById.set(recommendation.id, recommendation);
      created.push(toRecommendation(recommendation));
    }

    return created;
  }

  async acceptRecommendation(
    storeId: string,
    id: string,
    input: AcceptReplenishmentRecommendationInput,
    purchaseOrderNumber: string,
  ): Promise<AcceptReplenishmentRecommendationResult> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findRecommendationById(storeId, id);
    if (!existing) {
      throw new Error(`Replenishment recommendation not found: ${id}`);
    }

    if (existing.status !== "pending") {
      throw new Error("INVALID_RECOMMENDATION_STATUS");
    }

    const item = {
      productVariantId: existing.productVariantId,
      quantityOrdered: existing.recommendedQuantity,
      unitCost: input.unitCost,
      currency: input.currency,
    };

    const draft =
      await this.purchaseOrderRepository.findDraftByWarehouseAndSupplier(
        storeId,
        existing.warehouseId,
        existing.supplierId,
      );

    let purchaseOrder;
    let purchaseOrderCreated = false;

    if (draft) {
      purchaseOrder = await this.purchaseOrderRepository.appendItemsToDraft(
        storeId,
        draft.id,
        [item],
      );
    } else {
      purchaseOrder = await this.purchaseOrderRepository.create({
        storeId,
        warehouseId: existing.warehouseId,
        supplierId: existing.supplierId,
        purchaseOrderNumber,
        items: [item],
      });
      purchaseOrderCreated = true;
    }

    const updated: ReplenishmentRecommendation = {
      ...existing,
      status: "accepted",
      purchaseOrderId: purchaseOrder.id,
      updatedAt: new Date().toISOString(),
    };

    this.recommendationsById.set(id, updated);

    return {
      recommendation: toRecommendation(updated),
      purchaseOrder,
      purchaseOrderCreated,
    };
  }

  async dismissRecommendation(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = await this.findRecommendationById(storeId, id);
    if (!existing) {
      throw new Error(`Replenishment recommendation not found: ${id}`);
    }

    if (existing.status !== "pending") {
      throw new Error("INVALID_RECOMMENDATION_STATUS");
    }

    const updated: ReplenishmentRecommendation = {
      ...existing,
      status: "dismissed",
      updatedAt: new Date().toISOString(),
    };

    this.recommendationsById.set(id, updated);
    return toRecommendation(updated);
  }

  private async findPendingRecommendation(
    storeId: string,
    warehouseId: string,
    productVariantId: string,
  ): Promise<ReplenishmentRecommendation | null> {
    for (const recommendation of this.recommendationsById.values()) {
      if (
        recommendation.storeId === storeId &&
        recommendation.warehouseId === warehouseId &&
        recommendation.productVariantId === productVariantId &&
        recommendation.status === "pending"
      ) {
        return recommendation;
      }
    }

    return null;
  }

  private async assertRuleAvailable(
    storeId: string,
    warehouseId: string,
    productVariantId: string,
    exceptId?: string,
  ): Promise<void> {
    for (const rule of this.rulesById.values()) {
      if (
        rule.storeId === storeId &&
        rule.warehouseId === warehouseId &&
        rule.productVariantId === productVariantId &&
        rule.id !== exceptId
      ) {
        throw new Error(
          `Replenishment rule already exists: ${warehouseId}/${productVariantId}`,
        );
      }
    }
  }

  /** Exposed for tests to seed recommendation state. */
  seedRecommendation(recommendation: ReplenishmentRecommendation): void {
    this.recommendationsById.set(recommendation.id, recommendation);
  }
}
