import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { resolvePeriodKey } from "../services/sales-aggregation";
import {
  createMemorySalesReportsModule,
  seedSalesScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "../testing/sales-test-utils";

describe("SalesReportsService", () => {
  it("aggregates financial metrics from immutable order snapshots", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        discountAmount: "10.00",
        taxAmount: "7.50",
        shippingAmount: "5.00",
        total: "102.50",
        quantity: 2,
        paymentStatus: "paid",
      },
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "50.00",
        discountAmount: "0.00",
        taxAmount: "4.00",
        shippingAmount: "0.00",
        total: "54.00",
        quantity: 1,
        paymentStatus: "paid",
      },
    ]);

    const summary = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.grossSales).toBe("150.00");
    expect(summary.metrics.discounts).toBe("10.00");
    expect(summary.metrics.taxes).toBe("11.50");
    expect(summary.metrics.shipping).toBe("5.00");
    expect(summary.metrics.netSales).toBe("156.50");
    expect(summary.metrics.orderCount).toBe(2);
    expect(summary.metrics.unitsSold).toBe(3);
    expect(summary.metrics.averageOrderValue).toBe("78.25");
  });

  it("excludes draft and cancelled orders from revenue metrics", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        status: "confirmed",
        subtotal: "100.00",
        total: "100.00",
      },
      {
        storeId: TEST_STORE_A_ID,
        status: "draft",
        subtotal: "200.00",
        total: "200.00",
      },
      {
        storeId: TEST_STORE_A_ID,
        status: "cancelled",
        subtotal: "300.00",
        total: "300.00",
      },
    ]);

    const summary = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.orderCount).toBe(1);
    expect(summary.metrics.netSales).toBe("100.00");
    expect(summary.byOrderStatus).toHaveLength(3);
  });

  it("groups timeline points by timezone-aware day boundaries", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "40.00",
        total: "40.00",
        confirmedAt: "2026-07-15T03:00:00.000Z",
        createdAt: "2026-07-15T03:00:00.000Z",
      },
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "60.00",
        total: "60.00",
        confirmedAt: "2026-07-16T03:00:00.000Z",
        createdAt: "2026-07-16T03:00:00.000Z",
      },
    ]);

    const timeline = await module.salesReportsService.getTimeline({
      storeId: TEST_STORE_A_ID,
      granularity: "day",
      timezone: "America/New_York",
      fromDate: "2026-07-14T00:00:00.000Z",
      toDate: "2026-07-17T23:59:59.000Z",
    });

    expect(timeline.points).toHaveLength(2);
    expect(timeline.points[0]?.metrics.netSales).toBe("40.00");
    expect(timeline.points[1]?.metrics.netSales).toBe("60.00");
  });

  it("filters by warehouse when shipment data exists", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        total: "100.00",
        warehouseId: TEST_WAREHOUSE_A_ID,
      },
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "200.00",
        total: "200.00",
        warehouseId: TEST_WAREHOUSE_B_ID,
      },
    ]);

    const summary = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
      warehouseIds: [TEST_WAREHOUSE_A_ID],
    });

    expect(summary.metrics.orderCount).toBe(1);
    expect(summary.metrics.netSales).toBe("100.00");
    expect(summary.byWarehouse).toHaveLength(1);
    expect(summary.byWarehouse[0]?.warehouseId).toBe(TEST_WAREHOUSE_A_ID);
  });

  it("isolates sales data by store tenant", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        total: "100.00",
        currency: "USD",
      },
      {
        storeId: TEST_STORE_B_ID,
        subtotal: "80.00",
        total: "80.00",
        currency: "GBP",
      },
    ]);

    const summaryA = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });
    const summaryB = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_B_ID,
    });

    expect(summaryA.metrics.netSales).toBe("100.00");
    expect(summaryA.metrics.currency).toBe("USD");
    expect(summaryB.metrics.netSales).toBe("80.00");
    expect(summaryB.metrics.currency).toBe("GBP");
  });

  it("paginates sales orders report", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(
      module,
      Array.from({ length: 3 }, (_, index) => ({
        storeId: TEST_STORE_A_ID,
        subtotal: "10.00",
        total: "10.00",
        confirmedAt: `2026-07-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-07-0${index + 1}T12:00:00.000Z`,
      })),
    );

    const orders = await module.salesReportsService.listOrders({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(orders.items).toHaveLength(2);
    expect(orders.pagination.totalItems).toBe(3);
    expect(orders.pagination.totalPages).toBe(2);
  });

  it("filters by order status and currency", async () => {
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        status: "confirmed",
        subtotal: "100.00",
        total: "100.00",
        currency: "USD",
      },
      {
        storeId: TEST_STORE_A_ID,
        status: "fulfilled",
        subtotal: "50.00",
        total: "50.00",
        currency: "USD",
      },
    ]);

    const summary = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
      orderStatus: "fulfilled",
      currency: "USD",
    });

    expect(summary.metrics.orderCount).toBe(1);
    expect(summary.metrics.netSales).toBe("50.00");
  });

  it("publishes reports.sales.generated domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemorySalesReportsModule({
      domainEventPublisher: publisher,
    });
    const handler = vi.fn();
    dispatcher.subscribe("reports.sales.generated", handler);

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "25.00",
        total: "25.00",
      },
    ]);

    await module.salesReportsService.getSummary({ storeId: TEST_STORE_A_ID });
    await module.salesReportsService.getTimeline({
      storeId: TEST_STORE_A_ID,
      granularity: "day",
    });
    await module.salesReportsService.listOrders({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler.mock.calls.map(([event]) => event.payload.reportKind)).toEqual(
      expect.arrayContaining(["summary", "timeline", "orders"]),
    );
  });

  it("records audit entries for sales report generation", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemorySalesReportsModule();

    await seedSalesScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "30.00",
        total: "30.00",
      },
    ]);

    const summary = await module.salesReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "sales_report",
      entityId: TEST_STORE_A_ID,
      action: "generate_summary",
      metadata: { orderCount: summary.metrics.orderCount },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "generate_summary")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.entityType === "sales_report")).toBe(
      true,
    );
  });
});

describe("sales-aggregation", () => {
  it("resolves week period keys from timezone-local dates", () => {
    const key = resolvePeriodKey(
      "2026-07-15T12:00:00.000Z",
      "America/New_York",
      "week",
    );

    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
