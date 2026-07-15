import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  seedConfirmedReservedOrder,
  seedPackedShipmentWithAllocations,
} from "@/fulfillment/testing/fulfillment-test-utils";
import { seedPickedNotPackedShipment } from "@/fulfillment/testing/fulfillment-test-utils";
import { validReplenishmentRuleInput } from "@/replenishment/testing/replenishment-test-utils";
import { seedInspectedReturn } from "@/returns/testing/return-test-utils";
import {
  seedApprovedWarehouseTransfer,
  seedSecondWarehouse,
} from "@/warehouse-transfers/testing/warehouse-transfer-test-utils";
import {
  OPERATIONS_INTEGRITY_CODES,
  PHASE3_READINESS_CODES,
} from "../services/operations-utils";
import {
  createMemoryOperationsModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SUPPLIER_A_ID,
} from "../testing/operations-test-utils";

async function seedFullOperationalLifecycle(
  module: ReturnType<typeof createMemoryOperationsModule>,
) {
  const { inventoryItem, shipment, order } = await seedPackedShipmentWithAllocations(
    module,
    { initialQuantity: 30, orderQuantity: 2 },
  );

  await module.fulfillmentService.fulfillShipment(
    { storeId: TEST_STORE_A_ID },
    shipment.id,
  );

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
  const poItem = ordered.items[0]!;

  await module.purchaseOrderService.receivePurchaseOrder(ordered.id, {
    storeId: TEST_STORE_A_ID,
    items: [{ purchaseOrderItemId: poItem.id, quantityReceived: 20 }],
  });

  await module.shipmentService.packShipment(
    { storeId: TEST_STORE_A_ID },
    shipment.id,
  );
  await module.shipmentService.shipShipment(
    { storeId: TEST_STORE_A_ID },
    shipment.id,
  );
  await module.shipmentService.deliverShipment(
    { storeId: TEST_STORE_A_ID },
    shipment.id,
  );

  const orderItem = order.items[0];

  if (!orderItem) {
    throw new Error("Expected order item");
  }

  const returnRecord = await module.returnService.createReturn(order.id, {
    storeId: TEST_STORE_A_ID,
    shipmentId: shipment.id,
    reason: "Wrong size",
    items: [
      {
        orderItemId: orderItem.id,
        inventoryItemId: inventoryItem.id,
        quantityRequested: 1,
      },
    ],
  });

  const returnItem = returnRecord.items[0];

  if (!returnItem) {
    throw new Error("Expected return item");
  }

  const received = await module.returnService.receiveReturn(returnRecord.id, {
    storeId: TEST_STORE_A_ID,
    items: [{ returnItemId: returnItem.id, quantityReceived: 1 }],
  });

  const receivedItem = received.items[0];

  if (!receivedItem) {
    throw new Error("Expected received item");
  }

  await module.returnService.inspectReturn(returnRecord.id, {
    storeId: TEST_STORE_A_ID,
    items: [{ returnItemId: receivedItem.id, condition: "new" }],
  });

  await module.returnService.completeReturn(returnRecord.id, {
    storeId: TEST_STORE_A_ID,
  });

  await module.replenishmentService.createRule(
    validReplenishmentRuleInput({
      warehouseId: inventoryItem.warehouseId,
      productVariantId: inventoryItem.productVariantId,
      supplierId: TEST_SUPPLIER_A_ID,
      reorderPoint: 5,
      reorderQuantity: 20,
    }),
  );

  return { inventoryItem, shipment };
}

describe("Phase3ReadinessService", () => {
  it("passes phase3 validation for full procurement to return lifecycle", async () => {
    const module = createMemoryOperationsModule();
    await seedFullOperationalLifecycle(module);

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(true);
    expect(result.overallStatus).toBe("READY");
  });

  it("detects warehouse transfer conflicts during active fulfillment", async () => {
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

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(false);
    expect(result.overallStatus).toBe("FAILED");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.TRANSFER_FULFILLMENT_CONFLICT,
        }),
      ]),
    );
  });

  it("validates multi-warehouse consistency with approved idle transfer", async () => {
    const module = createMemoryOperationsModule();
    await seedApprovedWarehouseTransfer(module);

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code === OPERATIONS_INTEGRITY_CODES.TRANSFER_FULFILLMENT_CONFLICT,
      ),
    ).toBe(false);
  });

  it("detects stale replenishment after purchase order receiving", async () => {
    const module = createMemoryOperationsModule();
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

    await module.replenishmentService.generateRecommendations({
      storeId: TEST_STORE_A_ID,
    });

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
    const poItem = ordered.items[0]!;

    await module.purchaseOrderService.receivePurchaseOrder(ordered.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ purchaseOrderItemId: poItem.id, quantityReceived: 20 }],
    });

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.PO_REPLENISHMENT_STALE,
        }),
      ]),
    );
  });

  it("detects return replenishment mismatch before completion rollback", async () => {
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

    await module.returnService.completeReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
    });

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
        }),
      ]),
    );
  });

  it("does not flag replenishment mismatch after failed return completion rollback", async () => {
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

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(
      result.issues.some(
        (issue) =>
          issue.code === OPERATIONS_INTEGRITY_CODES.RETURN_REPLENISHMENT_MISMATCH,
      ),
    ).toBe(false);
  });

  it("builds readiness report with all health sections", async () => {
    const module = createMemoryOperationsModule();
    await seedPackedShipmentWithAllocations(module);

    const report = await module.phase3ReadinessService.getReadinessReport({
      storeId: TEST_STORE_A_ID,
    });

    expect(report.storeId).toBe(TEST_STORE_A_ID);
    expect(report.overallStatus).toMatch(/^(READY|WARNING|FAILED)$/);
    expect(report.warehouseHealth.warehouseCount).toBeGreaterThan(0);
    expect(report.fulfillmentHealth.pendingShipmentCount).toBeGreaterThanOrEqual(0);
    expect(report.procurementHealth.activeSupplierCount).toBeGreaterThan(0);
    expect(report.inventoryHealth.inventoryItemCount).toBeGreaterThan(0);
    expect(report.shipmentHealth.activeShipmentCount).toBeGreaterThan(0);
    expect(report.returnHealth.openReturnCount).toBeGreaterThanOrEqual(0);
    expect(report.replenishmentHealth.activeReplenishmentRuleCount).toBeGreaterThanOrEqual(
      0,
    );
    expect(report.validation.checkedAt).toBeTruthy();
  });

  it("marks readiness report as WARNING when low stock exists without failures", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem } = await seedPackedShipmentWithAllocations(module, {
      initialQuantity: 4,
      orderQuantity: 1,
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

    await module.replenishmentService.generateRecommendations({
      storeId: TEST_STORE_A_ID,
    });

    const report = await module.phase3ReadinessService.getReadinessReport({
      storeId: TEST_STORE_A_ID,
    });

    expect(report.overallStatus).toBe("WARNING");
    expect(report.inventoryHealth.lowStockItemCount).toBeGreaterThan(0);
    expect(report.replenishmentHealth.pendingRecommendationCount).toBeGreaterThan(0);
  });

  it("detects orphaned allocations in readiness validation", async () => {
    const module = createMemoryOperationsModule();
    const { allocation } = await seedPackedShipmentWithAllocations(module);

    module.inventoryAllocationRepository.seedAllocation({
      ...allocation,
      id: "99999999-9999-9999-9999-999999999999",
      pickListItemId: "00000000-0000-0000-0000-000000000099",
    });

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PHASE3_READINESS_CODES.ORPHANED_ALLOCATION,
        }),
      ]),
    );
  });

  it("detects stock ledger inconsistency when reservations exceed on-hand", async () => {
    const module = createMemoryOperationsModule();
    const { inventoryItem } = await seedConfirmedReservedOrder(module, {
      initialQuantity: 10,
      orderQuantity: 8,
    });

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      quantityChange: -9,
      reason: "manual_adjustment",
    });

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: PHASE3_READINESS_CODES.STOCK_LEDGER_INCONSISTENT,
        }),
      ]),
    );
  });

  it("isolates phase3 validation by store", async () => {
    const module = createMemoryOperationsModule();
    await seedPackedShipmentWithAllocations(module);

    const result = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_B_ID,
    });

    expect(result.valid).toBe(true);
    expect(result.overallStatus).toBe("READY");
  });

  it("publishes domain events when phase3 validation and readiness report run", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryOperationsModule({ domainEventPublisher: publisher });
    const handler = vi.fn();
    dispatcher.subscribe("operations.phase3.validation.completed", handler);
    dispatcher.subscribe("operations.readiness.generated", handler);

    await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });
    await module.phase3ReadinessService.getReadinessReport({
      storeId: TEST_STORE_A_ID,
    });

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls.map(([event]) => event.eventType)).toEqual(
      expect.arrayContaining([
        "operations.phase3.validation.completed",
        "operations.readiness.generated",
      ]),
    );
  });

  it("records audit entries for phase3 validation and readiness report", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryOperationsModule();

    const validation = await module.phase3ReadinessService.runPhase3Validation({
      storeId: TEST_STORE_A_ID,
    });
    const report = await module.phase3ReadinessService.getReadinessReport({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "operations",
      entityId: TEST_STORE_A_ID,
      action: "phase3_validation",
      metadata: {
        valid: validation.valid,
        overallStatus: validation.overallStatus,
        issueCount: validation.issues.length,
      },
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "operations",
      entityId: TEST_STORE_A_ID,
      action: "readiness_report",
      metadata: {
        overallStatus: report.overallStatus,
        issueCount: report.validation.issues.length,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "phase3_validation")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.action === "readiness_report")).toBe(
      true,
    );
  });
});
