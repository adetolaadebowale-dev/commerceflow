import {
  Prisma,
  type PrismaClient,
  type ReplenishmentRecommendation as PrismaReplenishmentRecommendation,
  type ReplenishmentRule as PrismaReplenishmentRule,
} from "@prisma/client";
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

function toRule(record: PrismaReplenishmentRule): ReplenishmentRule {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    productVariantId: record.productVariantId,
    supplierId: record.supplierId,
    reorderPoint: record.reorderPoint,
    reorderQuantity: record.reorderQuantity,
    minimumQuantity: record.minimumQuantity ?? undefined,
    maximumQuantity: record.maximumQuantity ?? undefined,
    isEnabled: record.isEnabled,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toRecommendation(
  record: PrismaReplenishmentRecommendation,
): ReplenishmentRecommendation {
  return {
    id: record.id,
    storeId: record.storeId,
    warehouseId: record.warehouseId,
    supplierId: record.supplierId,
    productVariantId: record.productVariantId,
    recommendedQuantity: record.recommendedQuantity,
    currentQuantity: record.currentQuantity,
    reorderPoint: record.reorderPoint,
    status: record.status,
    purchaseOrderId: record.purchaseOrderId ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildRuleCreateData(input: CreateReplenishmentRuleInput) {
  return {
    storeId: input.storeId,
    warehouseId: input.warehouseId,
    productVariantId: input.productVariantId,
    supplierId: input.supplierId,
    reorderPoint: input.reorderPoint,
    reorderQuantity: input.reorderQuantity,
    minimumQuantity: input.minimumQuantity ?? null,
    maximumQuantity: input.maximumQuantity ?? null,
    isEnabled: input.isEnabled,
  };
}

function buildRuleUpdateData(input: UpdateReplenishmentRuleInput) {
  return {
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
  };
}

export class PrismaReplenishmentRepository implements ReplenishmentRepository {
  constructor(
    private readonly db: PrismaClient,
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async findRuleById(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRule | null> {
    const record = await this.db.replenishmentRule.findFirst({
      where: { id, storeId },
    });

    return record ? toRule(record) : null;
  }

  async listRules(query: ListReplenishmentRulesQuery) {
    const where: Prisma.ReplenishmentRuleWhereInput = {
      storeId: query.storeId,
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.isEnabled !== undefined ? { isEnabled: query.isEnabled } : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.replenishmentRule.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.replenishmentRule.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toRule),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async createRule(input: CreateReplenishmentRuleInput): Promise<ReplenishmentRule> {
    const record = await this.db.replenishmentRule.create({
      data: buildRuleCreateData(input),
    });

    return toRule(record);
  }

  async updateRule(
    storeId: string,
    id: string,
    input: UpdateReplenishmentRuleInput,
  ): Promise<ReplenishmentRule> {
    const result = await this.db.replenishmentRule.updateMany({
      where: { id, storeId },
      data: buildRuleUpdateData(input),
    });

    if (result.count === 0) {
      throw new Error(`Replenishment rule not found: ${id}`);
    }

    const record = await this.db.replenishmentRule.findFirstOrThrow({
      where: { id, storeId },
    });

    return toRule(record);
  }

  async deleteRule(storeId: string, id: string): Promise<ReplenishmentRule> {
    const existing = await this.findRuleById(storeId, id);

    if (!existing) {
      throw new Error(`Replenishment rule not found: ${id}`);
    }

    await this.db.replenishmentRule.delete({ where: { id } });
    return existing;
  }

  async findRecommendationById(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation | null> {
    const record = await this.db.replenishmentRecommendation.findFirst({
      where: { id, storeId },
    });

    return record ? toRecommendation(record) : null;
  }

  async listRecommendations(query: ListReplenishmentRecommendationsQuery) {
    const where: Prisma.ReplenishmentRecommendationWhereInput = {
      storeId: query.storeId,
      ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [records, total] = await Promise.all([
      this.db.replenishmentRecommendation.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: query.limit,
      }),
      this.db.replenishmentRecommendation.count({ where }),
    ]);

    return buildCatalogueListResult({
      items: records.map(toRecommendation),
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async generateRecommendations(
    input: GenerateReplenishmentRecommendationsInput,
  ): Promise<ReplenishmentRecommendation[]> {
    const rules = await this.db.replenishmentRule.findMany({
      where: {
        storeId: input.storeId,
        isEnabled: true,
        ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
      },
    });

    const created: ReplenishmentRecommendation[] = [];

    for (const rule of rules) {
      const pending = await this.db.replenishmentRecommendation.findFirst({
        where: {
          storeId: input.storeId,
          warehouseId: rule.warehouseId,
          productVariantId: rule.productVariantId,
          status: "pending",
        },
      });

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

      const record = await this.db.replenishmentRecommendation.create({
        data: {
          storeId: rule.storeId,
          warehouseId: rule.warehouseId,
          supplierId: rule.supplierId,
          productVariantId: rule.productVariantId,
          recommendedQuantity: rule.reorderQuantity,
          currentQuantity,
          reorderPoint: rule.reorderPoint,
          status: "pending",
        },
      });

      created.push(toRecommendation(record));
    }

    return created;
  }

  async acceptRecommendation(
    storeId: string,
    id: string,
    input: AcceptReplenishmentRecommendationInput,
    purchaseOrderNumber: string,
  ): Promise<AcceptReplenishmentRecommendationResult> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.replenishmentRecommendation.findFirst({
        where: { id, storeId },
      });

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

      const updated = await tx.replenishmentRecommendation.update({
        where: { id },
        data: {
          status: "accepted",
          purchaseOrderId: purchaseOrder.id,
        },
      });

      return {
        recommendation: toRecommendation(updated),
        purchaseOrder,
        purchaseOrderCreated,
      };
    });
  }

  async dismissRecommendation(
    storeId: string,
    id: string,
  ): Promise<ReplenishmentRecommendation> {
    const existing = await this.findRecommendationById(storeId, id);

    if (!existing) {
      throw new Error(`Replenishment recommendation not found: ${id}`);
    }

    if (existing.status !== "pending") {
      throw new Error("INVALID_RECOMMENDATION_STATUS");
    }

    const updated = await this.db.replenishmentRecommendation.update({
      where: { id },
      data: { status: "dismissed" },
    });

    return toRecommendation(updated);
  }
}
