import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryProcurementReportsModule,
  seedProcurementScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SUPPLIER_A_ID,
  TEST_WAREHOUSE_A_ID,
} from "../testing/procurement-test-utils";

const paginatedQuery = {
  storeId: TEST_STORE_A_ID,
  page: 1,
  limit: 20,
  sortBy: "reportTimestamp",
  sortDirection: "desc" as const,
};

describe("ProcurementReportsService", () => {
  it("aggregates purchase order count and value", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      {
        purchaseOrderStatus: "ordered",
        quantityOrdered: 10,
        unitCost: "12.50",
      },
      {
        purchaseOrderStatus: "ordered",
        quantityOrdered: 5,
        unitCost: "20.00",
      },
    ]);

    const summary = await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.purchaseOrderCount).toBe(2);
    expect(summary.metrics.purchaseOrderValue).toBe("225.00");
    expect(summary.purchaseOrderAnalytics.purchaseOrderCount).toBe(2);
  });

  it("calculates receiving and partial receiving rates", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      {
        purchaseOrderStatus: "received",
        quantityOrdered: 10,
        quantityReceived: 10,
      },
      {
        purchaseOrderStatus: "partially_received",
        quantityOrdered: 10,
        quantityReceived: 4,
      },
    ]);

    const summary = await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.receivingAnalytics.totalQuantityOrdered).toBe(20);
    expect(summary.receivingAnalytics.totalQuantityReceived).toBe(14);
    expect(summary.receivingAnalytics.receivingRate).toBe("70.00");
    expect(summary.receivingAnalytics.partialReceivingRate).toBe("50.00");
  });

  it("aggregates supplier purchase volume and on-time receiving", async () => {
    const module = createMemoryProcurementReportsModule();
    const onTimeDate = "2026-07-10T12:00:00.000Z";
    const expectedDate = "2026-07-15T00:00:00.000Z";
    const lateDate = "2026-07-20T12:00:00.000Z";

    await seedProcurementScenario(module, [
      {
        purchaseOrderStatus: "received",
        quantityOrdered: 10,
        quantityReceived: 10,
        unitCost: "10.00",
        receivedAt: onTimeDate,
        expectedDeliveryDate: expectedDate,
      },
      {
        purchaseOrderStatus: "received",
        quantityOrdered: 5,
        quantityReceived: 5,
        unitCost: "10.00",
        receivedAt: lateDate,
        expectedDeliveryDate: expectedDate,
      },
    ]);

    const report = await module.procurementReportsService.getSupplierAnalytics(
      paginatedQuery,
    );

    expect(report.summary.purchaseVolume).toBe("150.00");
    expect(report.items[0]?.purchaseVolume).toBe("150.00");
    expect(report.items[0]?.onTimeReceivingRate).toBe("50.00");
  });

  it("aggregates warehouse throughput, turnover, and fulfillment volume", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      {
        purchaseOrderStatus: "ordered",
        movementQuantity: -10,
        inventoryQuantity: 20,
        shipmentStatus: "shipped",
        transferQuantity: 8,
      },
    ]);

    const report = await module.procurementReportsService.getWarehouseAnalytics(
      paginatedQuery,
    );

    const warehouseRow = report.items.find(
      (row) => row.warehouseId === TEST_WAREHOUSE_A_ID,
    );

    expect(warehouseRow?.throughput).toBe(10);
    expect(warehouseRow?.inventoryTurnover).toBe("50.00");
    expect(warehouseRow?.transferVolume).toBe(8);
    expect(warehouseRow?.fulfillmentVolume).toBe(1);
    expect(report.summary.totalFulfillmentVolume).toBe(1);
  });

  it("aggregates replenishment recommendation metrics", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      { recommendationStatus: "accepted" },
      { recommendationStatus: "dismissed" },
      { recommendationStatus: "pending" },
    ]);

    const report =
      await module.procurementReportsService.getReplenishmentAnalytics(
        paginatedQuery,
      );

    expect(report.summary.recommendationCount).toBe(3);
    expect(report.summary.acceptedCount).toBe(1);
    expect(report.summary.dismissedCount).toBe(1);
    expect(report.summary.acceptanceRate).toBe("50.00");
  });

  it("aggregates transfer volume metrics", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      { transferQuantity: 12, transferStatus: "received" },
      { transferQuantity: 8, transferStatus: "in_transit" },
    ]);

    const summary = await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.transferAnalytics.transferCount).toBe(2);
    expect(summary.transferAnalytics.transferVolume).toBe(20);
    expect(summary.metrics.transferVolume).toBe(20);
  });

  it("aggregates receiving metrics from purchase order snapshots", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      {
        purchaseOrderStatus: "partially_received",
        quantityOrdered: 20,
        quantityReceived: 5,
      },
    ]);

    const report = await module.procurementReportsService.getPurchaseOrderAnalytics(
      paginatedQuery,
    );

    expect(report.summary.quantityOrdered).toBe(20);
    expect(report.summary.quantityReceived).toBe(5);
    expect(report.summary.receivingRate).toBe("25.00");
  });

  it("enforces tenant isolation", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      { storeId: TEST_STORE_A_ID, quantityOrdered: 10 },
      { storeId: TEST_STORE_B_ID, quantityOrdered: 50 },
    ]);

    const summary = await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.purchaseOrderCount).toBe(1);
    expect(summary.metrics.purchaseOrderValue).toBe("100.00");
  });

  it("paginates purchase order analytics", async () => {
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [
      { quantityOrdered: 1 },
      { quantityOrdered: 2 },
      { quantityOrdered: 3 },
    ]);

    const report = await module.procurementReportsService.getPurchaseOrderAnalytics({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
      sortBy: "reportTimestamp",
      sortDirection: "desc",
    });

    expect(report.items).toHaveLength(2);
    expect(report.pagination.totalItems).toBe(3);
    expect(report.pagination.totalPages).toBe(2);
  });

  it("publishes reports.procurement.generated domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryProcurementReportsModule({
      domainEventPublisher: publisher,
    });
    const handler = vi.fn();
    dispatcher.subscribe("reports.procurement.generated", handler);

    await seedProcurementScenario(module, [{ quantityOrdered: 5 }]);

    await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]?.payload.reportKind).toBe("summary");
  });

  it("records procurement report audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryProcurementReportsModule();

    await seedProcurementScenario(module, [{ quantityOrdered: 5 }]);

    const summary = await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "procurement_report",
      entityId: TEST_STORE_A_ID,
      action: "generate_summary",
      metadata: { purchaseOrderCount: summary.metrics.purchaseOrderCount },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.entityType === "procurement_report")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.action === "generate_summary")).toBe(true);
  });

  it("filters by supplier ids", async () => {
    const module = createMemoryProcurementReportsModule();
    const otherSupplierId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

    module.procurementReportRepository.seedSupplier({
      id: otherSupplierId,
      storeId: TEST_STORE_A_ID,
      code: "OTHER",
      name: "Other Supplier",
      paymentTerm: "net30",
      currency: "USD",
      status: "active",
      contacts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await seedProcurementScenario(module, [
      { supplierId: TEST_SUPPLIER_A_ID, quantityOrdered: 10 },
      { supplierId: otherSupplierId, quantityOrdered: 20 },
    ]);

    const summary = await module.procurementReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
      supplierIds: [TEST_SUPPLIER_A_ID],
    });

    expect(summary.metrics.purchaseOrderCount).toBe(1);
    expect(summary.metrics.purchaseOrderValue).toBe("100.00");
  });
});
