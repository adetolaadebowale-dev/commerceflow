import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { seedPickedNotPackedShipment } from "@/fulfillment/testing/fulfillment-test-utils";
import { MemoryInventoryAllocationRepository } from "@/inventory-allocation/repositories/memory-inventory-allocation.repository";
import { validReplenishmentRuleInput } from "@/replenishment/testing/replenishment-test-utils";
import { seedInspectedReturn } from "@/returns/testing/return-test-utils";
import { seedApprovedWarehouseTransfer, seedSecondWarehouse } from "@/warehouse-transfers/testing/warehouse-transfer-test-utils";
import { OPERATIONS_INTEGRITY_CODES } from "../services/operations-utils";
import {
  createMemoryOperationsModule,
  seedPackedShipmentWithAllocations,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SUPPLIER_A_ID,
} from "../testing/operations-test-utils";

async function seedLowStockRecommendation(
  module: ReturnType<typeof createMemoryOperationsModule>,
) {
  const { inventoryItem } = await seedPackedShipmentWithAllocations(module, {
    initialQuantity: 6,
    orderQuantity: 2,
  });

  await module.replenishmentService.createRule(
    validReplenishmentRuleInput({
      warehouseId: inventoryItem.warehouseId,
      productVariantId: inventoryItem.productVariantId,
      supplierId: TEST_SUPPLIER_A_ID,
      reorderPoint: 10,
      reorderQuantity: 20,
    }),
  );

  const recommendations =
    await module.replenishmentService.generateRecommendations({
      storeId: TEST_STORE_A_ID,
    });

  const recommendation = recommendations[0];

  if (!recommendation) {
    throw new Error("Expected replenishment recommendation");
  }

  return { inventoryItem, recommendation };
}

describe("OperationalIntegrityService", () => {
  it("passes integrity check for end-to-end fulfillment workflow", async () => {
    const module = createMemoryOperationsModule();
    const { shipment } = await seedPackedShipmentWithAllocations(module);

    await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    const result = await module.operationalIntegrityService.runIntegrityCheck({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("detects shipment pick state mismatch", async () => {
    const module = createMemoryOperationsModule();
    const { shipment } = await seedPickedNotPackedShipment(module);

    await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    const result = await module.operationalIntegrityService.runWarehouseValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.SHIPMENT_PICK_STATE_MISMATCH,
        }),
      ]),
    );
  });

  it("detects warehouse transfer conflicts with active fulfillment", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem } = await seedPickedNotPackedShipment(module);

    const destinationWarehouse = await seedSecondWarehouse(module);

    const transfer = await module.warehouseTransferService.createWarehouseTransfer({
      storeId: TEST_STORE_A_ID,
      sourceWarehouseId: inventoryItem.warehouseId,
      destinationWarehouseId: destinationWarehouse.id,
      items: [{ inventoryItemId: inventoryItem.id, quantity: 2 }],
    });

    await module.warehouseTransferService.approveWarehouseTransfer(transfer.id, {
      storeId: TEST_STORE_A_ID,
    });

    const result = await module.operationalIntegrityService.runWarehouseValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.TRANSFER_FULFILLMENT_CONFLICT,
        }),
      ]),
    );
  });

  it("detects stale replenishment after purchase order receiving", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem, recommendation } =
      await seedLowStockRecommendation(module);

    const purchaseOrder = await module.purchaseOrderService.createPurchaseOrder({
      storeId: TEST_STORE_A_ID,
      warehouseId: inventoryItem.warehouseId,
      supplierId: TEST_SUPPLIER_A_ID,
      items: [
        {
          productVariantId: inventoryItem.productVariantId,
          quantityOrdered: 20,
          unitCost: "10.00",
          currency: "USD",
        },
      ],
    });

    const approved = await module.purchaseOrderService.approvePurchaseOrder(
      purchaseOrder.id,
      { storeId: TEST_STORE_A_ID },
    );
    const ordered = await module.purchaseOrderService.orderPurchaseOrder(
      approved.id,
      { storeId: TEST_STORE_A_ID },
    );
    const item = ordered.items[0]!;

    await module.purchaseOrderService.receivePurchaseOrder(ordered.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ purchaseOrderItemId: item.id, quantityReceived: 20 }],
    });

    const result = await module.operationalIntegrityService.runInventoryValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.PO_REPLENISHMENT_STALE,
          entityId: recommendation.id,
        }),
      ]),
    );
  });

  it("detects return and replenishment interaction mismatch", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem, returnRecord } = await seedInspectedReturn(module, {
      initialQuantity: 12,
      orderQuantity: 2,
      quantityRequested: 2,
    });

    await module.replenishmentService.createRule(
      validReplenishmentRuleInput({
        warehouseId: inventoryItem.warehouseId,
        productVariantId: inventoryItem.productVariantId,
        supplierId: TEST_SUPPLIER_A_ID,
        reorderPoint: 10,
      }),
    );

    const recommendations =
      await module.replenishmentService.generateRecommendations({
        storeId: TEST_STORE_A_ID,
      });

    const recommendation = recommendations[0];

    if (!recommendation) {
      throw new Error("Expected recommendation");
    }

    await module.returnService.completeReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
    });

    const result = await module.operationalIntegrityService.runInventoryValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
          entityId: recommendation.id,
        }),
      ]),
    );
  });

  it("detects allocation holds not released after fulfillment", async () => {
    const module = createMemoryOperationsModule();
    const { shipment, allocation } =
      await seedPackedShipmentWithAllocations(module);

    await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    const fulfilled = await module.inventoryAllocationRepository.findById(
      TEST_STORE_A_ID,
      allocation.id,
    );

    if (!fulfilled) {
      throw new Error("Expected allocation");
    }

    (
      module.inventoryAllocationRepository as MemoryInventoryAllocationRepository
    ).seedAllocation({
      ...fulfilled,
      status: "picked",
    });

    const result = await module.operationalIntegrityService.runInventoryValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.ALLOCATION_NOT_RELEASED,
          entityId: allocation.id,
        }),
      ]),
    );
  });

  it("builds read models for warehouse operations", async () => {
    const module = createMemoryOperationsModule();
    await seedPackedShipmentWithAllocations(module);

    const summary =
      await module.operationalIntegrityService.getWarehouseOperationalSummary({
        storeId: TEST_STORE_A_ID,
      });
    const fulfillment =
      await module.operationalIntegrityService.getFulfillmentDashboard({
        storeId: TEST_STORE_A_ID,
      });
    const procurement =
      await module.operationalIntegrityService.getProcurementDashboard({
        storeId: TEST_STORE_A_ID,
      });
    const health =
      await module.operationalIntegrityService.getInventoryHealthSummary({
        storeId: TEST_STORE_A_ID,
      });

    expect(summary.warehouseCount).toBeGreaterThan(0);
    expect(fulfillment.shipmentsByStatus.length).toBeGreaterThan(0);
    expect(procurement.activeSupplierCount).toBeGreaterThan(0);
    expect(health.inventoryItemCount).toBeGreaterThan(0);
  });

  it("isolates integrity checks by store", async () => {
    const module = createMemoryOperationsModule();
    await seedPackedShipmentWithAllocations(module);

    const result = await module.operationalIntegrityService.runIntegrityCheck({
      storeId: TEST_STORE_B_ID,
    });

    expect(result.valid).toBe(true);
  });

  it("publishes domain events when integrity checks run", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryOperationsModule({ domainEventPublisher: publisher });
    const handler = vi.fn();
    dispatcher.subscribe("operations.integrity.checked", handler);
    dispatcher.subscribe("warehouse.integrity.checked", handler);
    dispatcher.subscribe("inventory.integrity.checked", handler);

    await module.operationalIntegrityService.runIntegrityCheck({
      storeId: TEST_STORE_A_ID,
    });

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler.mock.calls.map(([event]) => event.eventType)).toEqual(
      expect.arrayContaining([
        "operations.integrity.checked",
        "warehouse.integrity.checked",
        "inventory.integrity.checked",
      ]),
    );
  });

  it("records audit entries for integrity validation runs", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryOperationsModule();

    const result = await module.operationalIntegrityService.runIntegrityCheck({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "operations",
      entityId: TEST_STORE_A_ID,
      action: "integrity_check",
      metadata: {
        valid: result.valid,
        issueCount: result.issues.length,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "integrity_check")).toBe(
      true,
    );
  });

  it("uses approved warehouse transfer seed without false conflicts when idle", async () => {
    const module = createMemoryOperationsModule();
    await seedApprovedWarehouseTransfer(module);

    const result = await module.operationalIntegrityService.runWarehouseValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code === OPERATIONS_INTEGRITY_CODES.TRANSFER_FULFILLMENT_CONFLICT,
      ),
    ).toBe(false);
  });

  it("detects stale replenishment after approved cycle count", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem, recommendation } =
      await seedLowStockRecommendation(module);

    const cycleCount = await module.cycleCountService.createCycleCount({
      storeId: TEST_STORE_A_ID,
      warehouseId: inventoryItem.warehouseId,
      inventoryItemIds: [inventoryItem.id],
    });
    const started = await module.cycleCountService.startCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
    );
    const item = started.items[0]!;

    await module.cycleCountService.completeCycleCount(cycleCount.id, {
      storeId: TEST_STORE_A_ID,
      items: [
        {
          cycleCountItemId: item.id,
          countedQuantity: item.expectedQuantity - 2,
        },
      ],
    });
    await module.cycleCountService.approveCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
      "user-1",
    );

    const result = await module.operationalIntegrityService.runInventoryValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.CYCLE_COUNT_REPLENISHMENT_STALE,
          entityId: recommendation.id,
        }),
      ]),
    );
  });

  it("detects inventory adjustment warehouse consistency issues", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem } = await seedPackedShipmentWithAllocations(module, {
      initialQuantity: 10,
      orderQuantity: 1,
    });

    await module.inventoryAdjustmentRepository.createAdjustment({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      adjustmentNumber: "ADJ-001",
      movementQuantity: -1,
      reason: "damage",
      createdByUserId: "user-1",
    });

    await module.inventoryItemRepository.restockForReturn(
      TEST_STORE_A_ID,
      inventoryItem.id,
      1,
      {
        returnId: "return-1",
        returnItemId: "return-item-1",
        reference: "RET-001",
      },
    );

    const result = await module.operationalIntegrityService.runInventoryValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.ADJUSTMENT_WAREHOUSE_MISMATCH,
        }),
      ]),
    );
  });

  it("does not flag return replenishment mismatch after failed completion rollback", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem, returnRecord } = await seedInspectedReturn(module, {
      initialQuantity: 12,
      orderQuantity: 2,
      quantityRequested: 2,
    });

    await module.replenishmentService.createRule(
      validReplenishmentRuleInput({
        warehouseId: inventoryItem.warehouseId,
        productVariantId: inventoryItem.productVariantId,
        supplierId: TEST_SUPPLIER_A_ID,
        reorderPoint: 10,
      }),
    );

    await module.replenishmentService.generateRecommendations({
      storeId: TEST_STORE_A_ID,
    });

    module.returnRepository.setTransactionFailure(new Error("RETURN_ROLLBACK"));

    await expect(
      module.returnService.completeReturn(returnRecord.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toThrow();

    const result = await module.operationalIntegrityService.runInventoryValidation({
      storeId: TEST_STORE_A_ID,
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code === OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
      ),
    ).toBe(false);
  });
});
