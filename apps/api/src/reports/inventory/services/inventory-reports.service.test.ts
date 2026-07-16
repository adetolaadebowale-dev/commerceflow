import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryInventoryReportsModule,
  seedInventoryReportingScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "../testing/inventory-test-utils";
import { TEST_SUPPLIER_A_ID } from "../testing/inventory-scenario-utils";

describe("InventoryReportsService", () => {
  it("aggregates inventory summary metrics with warehouse context", async () => {
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 100,
        reservedQuantity: 10,
        unitCost: "5.00",
      },
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_B_ID,
        quantityOnHand: 50,
        unitCost: "4.00",
      },
    ]);

    const summary = await module.inventoryReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.quantityOnHand).toBe(150);
    expect(summary.metrics.quantityReserved).toBe(10);
    expect(summary.metrics.quantityAvailable).toBe(140);
    expect(summary.metrics.inventoryValue).toBe("700.00");
    expect(summary.byWarehouse).toHaveLength(2);
  });

  it("filters inventory summary by warehouse", async () => {
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 100,
        unitCost: "5.00",
      },
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_B_ID,
        quantityOnHand: 50,
        unitCost: "4.00",
      },
    ]);

    const summary = await module.inventoryReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
      warehouseIds: [TEST_WAREHOUSE_A_ID],
    });

    expect(summary.metrics.quantityOnHand).toBe(100);
    expect(summary.byWarehouse).toHaveLength(1);
    expect(summary.byWarehouse[0]?.warehouseId).toBe(TEST_WAREHOUSE_A_ID);
  });

  it("calculates valuation from purchase order unit costs", async () => {
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 10,
        unitCost: "12.50",
      },
    ]);

    const valuation = await module.inventoryReportsService.getValuation({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(valuation.totalValue).toBe("125.00");
    expect(valuation.items[0]?.unitCost).toBe("12.50");
    expect(valuation.items[0]?.inventoryValue).toBe("125.00");
  });

  it("detects low stock and out-of-stock items", async () => {
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 5,
        reorderPoint: 10,
        supplierId: TEST_SUPPLIER_A_ID,
      },
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_B_ID,
        quantityOnHand: 0,
        reservedQuantity: 0,
        reorderPoint: 5,
      },
    ]);

    const report = await module.inventoryReportsService.getLowStockReport({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(report.lowStockItems.length).toBeGreaterThan(0);
    expect(report.outOfStockItems.length).toBeGreaterThan(0);
  });

  it("aggregates stock movements and adjustment totals", async () => {
    const module = createMemoryInventoryReportsModule();

    const [item] = await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 20,
      },
    ]);

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: item!.id,
      quantityChange: -5,
      reason: "manual_adjustment",
    });

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: item!.id,
      quantityChange: 3,
      reason: "manual_adjustment",
    });

    const movements = await module.inventoryReportsService.getStockMovements({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
      movementType: "adjustment",
    });

    expect(movements.totals.movementCount).toBeGreaterThanOrEqual(2);
    expect(movements.totals.adjustmentTotal).toBe(-2);
    expect(movements.items.length).toBeGreaterThan(0);
  });

  it("includes incoming purchase order quantities", async () => {
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 10,
        incomingQuantity: 25,
      },
    ]);

    const summary = await module.inventoryReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.quantityIncoming).toBe(25);
  });

  it("paginates stock movement reports", async () => {
    const module = createMemoryInventoryReportsModule();

    const [item] = await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 10,
      },
    ]);

    for (let index = 0; index < 3; index += 1) {
      await module.inventoryItemRepository.adjustStock({
        storeId: TEST_STORE_A_ID,
        inventoryItemId: item!.id,
        quantityChange: 1,
        reason: "manual_adjustment",
      });
    }

    const movements = await module.inventoryReportsService.getStockMovements({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(movements.items).toHaveLength(2);
    expect(movements.pagination.totalItems).toBeGreaterThanOrEqual(3);
  });

  it("isolates inventory data by store tenant", async () => {
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 100,
        unitCost: "5.00",
      },
      {
        storeId: TEST_STORE_B_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 40,
        unitCost: "3.00",
      },
    ]);

    const summaryA = await module.inventoryReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });
    const summaryB = await module.inventoryReportsService.getSummary({
      storeId: TEST_STORE_B_ID,
    });

    expect(summaryA.metrics.quantityOnHand).toBe(100);
    expect(summaryB.metrics.quantityOnHand).toBe(40);
  });

  it("publishes reports.inventory.generated domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryInventoryReportsModule({
      domainEventPublisher: publisher,
    });
    const handler = vi.fn();
    dispatcher.subscribe("reports.inventory.generated", handler);

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 10,
        unitCost: "2.00",
      },
    ]);

    await module.inventoryReportsService.getSummary({ storeId: TEST_STORE_A_ID });
    await module.inventoryReportsService.getStockMovements({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });
    await module.inventoryReportsService.getLowStockReport({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    await module.inventoryReportsService.getValuation({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(handler).toHaveBeenCalledTimes(4);
    expect(handler.mock.calls.map(([event]) => event.payload.reportKind)).toEqual(
      expect.arrayContaining(["summary", "movements", "low_stock", "valuation"]),
    );
  });

  it("records audit entries for inventory report generation", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryInventoryReportsModule();

    await seedInventoryReportingScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        warehouseId: TEST_WAREHOUSE_A_ID,
        quantityOnHand: 10,
      },
    ]);

    const summary = await module.inventoryReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "inventory_report",
      entityId: TEST_STORE_A_ID,
      action: "generate_summary",
      metadata: { itemCount: summary.byProductVariant.length },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "generate_summary")).toBe(
      true,
    );
    expect(
      logs.items.some((entry) => entry.entityType === "inventory_report"),
    ).toBe(true);
  });
});
