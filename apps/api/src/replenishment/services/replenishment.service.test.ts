import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { REPLENISHMENT_ERROR_CODES } from "../errors";
import {
  createMemoryReplenishmentModule,
  seedPendingRecommendation,
  seedReplenishmentRule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validReplenishmentRuleInput,
} from "../testing/replenishment-test-utils";
import { TEST_VARIANT_B_ID } from "@/reservations/testing/reservation-test-utils";

describe("ReplenishmentService", () => {
  it("creates and retrieves replenishment rules", async () => {
    const module = createMemoryReplenishmentModule();
    const { rule } = await seedReplenishmentRule(module);

    const fetched = await module.replenishmentService.getRule(
      TEST_STORE_A_ID,
      rule.id,
    );

    expect(fetched.reorderPoint).toBe(10);
    expect(fetched.reorderQuantity).toBe(25);
    expect(fetched.isEnabled).toBe(true);
  });

  it("prevents duplicate rules for the same warehouse and variant", async () => {
    const module = createMemoryReplenishmentModule();
    const { inventoryItem, rule } = await seedReplenishmentRule(module);

    await expect(
      module.replenishmentService.createRule(
        validReplenishmentRuleInput({
          warehouseId: inventoryItem.warehouseId,
          productVariantId: inventoryItem.productVariantId,
        }),
      ),
    ).rejects.toMatchObject({
      code: REPLENISHMENT_ERROR_CODES.RULE_ALREADY_EXISTS,
      status: 409,
    });

    expect(rule.id).toBeDefined();
  });

  it("updates and deletes replenishment rules", async () => {
    const module = createMemoryReplenishmentModule();
    const { rule } = await seedReplenishmentRule(module);

    const updated = await module.replenishmentService.updateRule(
      TEST_STORE_A_ID,
      rule.id,
      { reorderPoint: 15, isEnabled: false },
    );

    expect(updated.reorderPoint).toBe(15);
    expect(updated.isEnabled).toBe(false);

    await module.replenishmentService.deleteRule(TEST_STORE_A_ID, rule.id);

    await expect(
      module.replenishmentService.getRule(TEST_STORE_A_ID, rule.id),
    ).rejects.toMatchObject({
      code: REPLENISHMENT_ERROR_CODES.RULE_NOT_FOUND,
      status: 404,
    });
  });

  it("generates recommendations when stock is below reorder point", async () => {
    const module = createMemoryReplenishmentModule();
    const { recommendation } = await seedPendingRecommendation(module, {
      initialQuantity: 4,
      reorderPoint: 10,
      reorderQuantity: 25,
    });

    expect(recommendation.status).toBe("pending");
    expect(recommendation.currentQuantity).toBe(4);
    expect(recommendation.recommendedQuantity).toBe(25);
  });

  it("does not generate recommendations when stock is sufficient", async () => {
    const module = createMemoryReplenishmentModule();
    const { inventoryItem } = await seedReplenishmentRule(module, {
      reorderPoint: 5,
    });

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      quantityChange: 20,
      reason: "manual_adjustment",
    });

    const recommendations =
      await module.replenishmentService.generateRecommendations({
        storeId: TEST_STORE_A_ID,
      });

    expect(recommendations).toHaveLength(0);
  });

  it("prevents duplicate pending recommendations for the same rule", async () => {
    const module = createMemoryReplenishmentModule();
    await seedPendingRecommendation(module, { initialQuantity: 2 });

    const secondBatch =
      await module.replenishmentService.generateRecommendations({
        storeId: TEST_STORE_A_ID,
      });

    expect(secondBatch).toHaveLength(0);
  });

  it("accepting a recommendation creates a draft purchase order", async () => {
    const module = createMemoryReplenishmentModule();
    const { recommendation } = await seedPendingRecommendation(module, {
      initialQuantity: 3,
    });

    const result = await module.replenishmentService.acceptRecommendation(
      recommendation.id,
      {
        storeId: TEST_STORE_A_ID,
        unitCost: "12.50",
        currency: "USD",
      },
    );

    expect(result.recommendation.status).toBe("accepted");
    expect(result.purchaseOrderCreated).toBe(true);
    expect(result.purchaseOrder.status).toBe("draft");
    expect(result.purchaseOrder.items).toHaveLength(1);
    expect(result.purchaseOrder.items[0]?.quantityOrdered).toBe(25);
    expect(result.recommendation.purchaseOrderId).toBe(result.purchaseOrder.id);
  });

  it("accepting appends to an existing compatible draft purchase order", async () => {
    const module = createMemoryReplenishmentModule();
    const first = await seedPendingRecommendation(module, {
      initialQuantity: 2,
      reorderQuantity: 10,
    });

    await module.replenishmentService.acceptRecommendation(
      first.recommendation.id,
      {
        storeId: TEST_STORE_A_ID,
        unitCost: "10.00",
        currency: "USD",
      },
    );

    const { inventoryItem } = await seedReplenishmentRule(module, {
      warehouseId: first.inventoryItem.warehouseId,
      productVariantId: TEST_VARIANT_B_ID,
      reorderPoint: 8,
      reorderQuantity: 15,
    });

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      quantityChange: 1,
      reason: "manual_adjustment",
    });

    const secondBatch =
      await module.replenishmentService.generateRecommendations({
        storeId: TEST_STORE_A_ID,
      });
    const secondRecommendation = secondBatch.find(
      (item) => item.productVariantId === TEST_VARIANT_B_ID,
    );

    const result = await module.replenishmentService.acceptRecommendation(
      secondRecommendation!.id,
      {
        storeId: TEST_STORE_A_ID,
        unitCost: "11.00",
        currency: "USD",
      },
    );

    expect(result.purchaseOrderCreated).toBe(false);
    expect(result.purchaseOrder.items).toHaveLength(2);
  });

  it("dismisses pending recommendations without creating purchase orders", async () => {
    const module = createMemoryReplenishmentModule();
    const { recommendation } = await seedPendingRecommendation(module);

    const dismissed = await module.replenishmentService.dismissRecommendation(
      TEST_STORE_A_ID,
      recommendation.id,
    );

    expect(dismissed.status).toBe("dismissed");
    expect(dismissed.purchaseOrderId).toBeUndefined();
  });

  it("enforces tenant isolation", async () => {
    const module = createMemoryReplenishmentModule();
    const { rule } = await seedReplenishmentRule(module);

    await expect(
      module.replenishmentService.getRule(TEST_STORE_B_ID, rule.id),
    ).rejects.toMatchObject({
      code: REPLENISHMENT_ERROR_CODES.RULE_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back failed acceptance transactions", async () => {
    const module = createMemoryReplenishmentModule();
    const { recommendation } = await seedPendingRecommendation(module);

    module.replenishmentRepository.setTransactionFailure(
      new Error("accept failed"),
    );

    await expect(
      module.replenishmentService.acceptRecommendation(recommendation.id, {
        storeId: TEST_STORE_A_ID,
        unitCost: "12.50",
        currency: "USD",
      }),
    ).rejects.toMatchObject({
      code: REPLENISHMENT_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const refreshed = await module.replenishmentService.getRecommendation(
      TEST_STORE_A_ID,
      recommendation.id,
    );
    expect(refreshed.status).toBe("pending");
  });
});

describe("ReplenishmentService domain events", () => {
  it("emits replenishment lifecycle events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();

    const ruleCreated = vi.fn();
    const recommendationGenerated = vi.fn();
    const recommendationAccepted = vi.fn();
    const purchaseOrderCreated = vi.fn();

    dispatcher.subscribe("replenishment-rule.created", ruleCreated);
    dispatcher.subscribe("replenishment.recommendation.generated", recommendationGenerated);
    dispatcher.subscribe("replenishment.recommendation.accepted", recommendationAccepted);
    dispatcher.subscribe("purchase-order.created", purchaseOrderCreated);

    const module = createMemoryReplenishmentModule({
      domainEventPublisher: publisher,
    });
    const { recommendation } = await seedPendingRecommendation(module);

    await vi.waitFor(() => {
      expect(ruleCreated).toHaveBeenCalledOnce();
      expect(recommendationGenerated).toHaveBeenCalledOnce();
    });

    await module.replenishmentService.acceptRecommendation(recommendation.id, {
      storeId: TEST_STORE_A_ID,
      unitCost: "12.50",
      currency: "USD",
    });

    await vi.waitFor(() => {
      expect(recommendationAccepted).toHaveBeenCalledOnce();
      expect(purchaseOrderCreated).toHaveBeenCalledOnce();
    });
  });
});

describe("Replenishment audit integration", () => {
  it("records rule and recommendation audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryReplenishmentModule();
    const { rule, recommendation } = await seedPendingRecommendation(module);

    await auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "replenishment_rule",
      entityId: rule.id,
      action: "create",
      metadata: { reorderPoint: rule.reorderPoint },
    });

    await auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-id",
      sessionId: "session-id",
      entityType: "replenishment_recommendation",
      entityId: recommendation.id,
      action: "generate",
      metadata: { status: recommendation.status },
    });

    expect(auditLogRepository.getAll()).toHaveLength(2);
  });
});
