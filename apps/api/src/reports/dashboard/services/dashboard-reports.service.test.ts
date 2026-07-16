import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  buildExecutiveSummary,
  flattenDashboardKPIs,
} from "../services/dashboard-aggregation";
import type { DashboardSourceSummaries } from "../repositories/dashboard-report.repository";
import {
  createMemoryDashboardReportsModule,
  seedDashboardScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
} from "../testing/dashboard-test-utils";

function buildMockSummaries(
  overrides: Partial<{
    grossRevenue: string;
    netRevenue: string;
    refundTotals: string;
    orderCount: number;
    totalCustomers: number;
    averageOrderValue: string;
    inventoryValue: string;
    lowStockCount: number;
    purchaseOrderValue: string;
    warehouseThroughput: number;
    fulfillmentVolume: number;
    collectionRate: string;
    replenishmentAcceptanceRate: string;
  }> = {},
): DashboardSourceSummaries {
  const currency = "USD";

  return {
    sales: {
      storeId: TEST_STORE_A_ID,
      generatedAt: new Date().toISOString(),
      timezone: "UTC",
      filter: { storeId: TEST_STORE_A_ID, currency },
      metrics: {
        grossSales: overrides.grossRevenue ?? "1000.00",
        discounts: "0.00",
        taxes: "0.00",
        shipping: "0.00",
        netSales: overrides.netRevenue ?? "950.00",
        averageOrderValue: overrides.averageOrderValue ?? "100.00",
        orderCount: overrides.orderCount ?? 10,
        unitsSold: 10,
        currency,
      },
      byDay: [],
      byWeek: [],
      byMonth: [],
      byOrderStatus: [],
      byPaymentStatus: [],
      byStore: [],
      byWarehouse: [],
    },
    financial: {
      storeId: TEST_STORE_A_ID,
      generatedAt: new Date().toISOString(),
      timezone: "UTC",
      filter: { storeId: TEST_STORE_A_ID, currency },
      metrics: {
        grossRevenue: overrides.grossRevenue ?? "1000.00",
        netRevenue: overrides.netRevenue ?? "950.00",
        discounts: "0.00",
        taxes: "0.00",
        shippingRevenue: "0.00",
        refundTotals: overrides.refundTotals ?? "50.00",
        invoiceTotals: "0.00",
        paymentTotals: "950.00",
        outstandingInvoices: "0.00",
        collectionRate: overrides.collectionRate ?? "100.00",
        averagePaymentAmount: "95.00",
        currency,
      },
      paymentSummary: {
        totalAmount: "950.00",
        paymentCount: 10,
        paidAmount: "950.00",
        paidCount: 10,
        authorizedAmount: "0.00",
        authorizedCount: 0,
        pendingAmount: "0.00",
        pendingCount: 0,
        failedAmount: "0.00",
        failedCount: 0,
        currency,
      },
      invoiceSummary: {
        totalAmount: "0.00",
        invoiceCount: 0,
        issuedAmount: "0.00",
        issuedCount: 0,
        paidAmount: "0.00",
        paidCount: 0,
        outstandingAmount: "0.00",
        outstandingCount: 0,
        voidAmount: "0.00",
        voidCount: 0,
        currency,
      },
      refundSummary: {
        totalAmount: overrides.refundTotals ?? "50.00",
        refundCount: 1,
        completedAmount: overrides.refundTotals ?? "50.00",
        completedCount: 1,
        pendingAmount: "0.00",
        pendingCount: 0,
        currency,
      },
      taxSummary: { totalTax: "0.00", orderCount: 10, currency },
      discountSummary: { totalDiscount: "0.00", orderCount: 10, currency },
      shippingRevenueSummary: { totalShipping: "0.00", orderCount: 10, currency },
    },
    inventory: {
      storeId: TEST_STORE_A_ID,
      generatedAt: new Date().toISOString(),
      timezone: "UTC",
      filter: { storeId: TEST_STORE_A_ID, currency },
      metrics: {
        quantityOnHand: 100,
        quantityReserved: 0,
        quantityAllocated: 0,
        quantityAvailable: 100,
        quantityIncoming: 0,
        quantityOutgoing: 0,
        inventoryValue: overrides.inventoryValue ?? "5000.00",
        stockMovementTotal: 0,
        adjustmentTotal: 0,
        currency,
      },
      byWarehouse: [],
      byProductVariant: [],
      lowStockItems: Array.from({ length: overrides.lowStockCount ?? 2 }).map(
        (_, index) => ({
          inventoryItemId: `item-${index}`,
          warehouseId: TEST_WAREHOUSE_A_ID,
          productVariantId: "variant",
          quantityOnHand: 1,
          quantityAvailable: 1,
          reorderPoint: 5,
        }),
      ),
      outOfStockItems: [],
      adjustmentReport: {
        adjustmentCount: 0,
        netAdjustmentQuantity: 0,
        positiveAdjustmentQuantity: 0,
        negativeAdjustmentQuantity: 0,
      },
    },
    customers: {
      storeId: TEST_STORE_A_ID,
      generatedAt: new Date().toISOString(),
      timezone: "UTC",
      filter: { storeId: TEST_STORE_A_ID, currency },
      metrics: {
        totalCustomers: overrides.totalCustomers ?? 5,
        activeCustomers: 5,
        newCustomers: 2,
        returningCustomers: 3,
        lifetimeValue: "950.00",
        averageOrderValue: overrides.averageOrderValue ?? "100.00",
        ordersPerCustomer: 2,
        revenuePerCustomer: "190.00",
        averagePurchaseIntervalDays: 30,
        currency,
      },
      newVsReturning: {
        newCustomers: 2,
        returningCustomers: 3,
        newCustomerRevenue: "200.00",
        returningCustomerRevenue: "750.00",
      },
      purchaseFrequency: [],
      geographicDistribution: [],
    },
    procurement: {
      storeId: TEST_STORE_A_ID,
      generatedAt: new Date().toISOString(),
      timezone: "UTC",
      filter: { storeId: TEST_STORE_A_ID, currency },
      metrics: {
        purchaseOrderCount: 3,
        purchaseOrderValue: overrides.purchaseOrderValue ?? "300.00",
        receivingRate: "80.00",
        partialReceivingRate: "10.00",
        transferVolume: 20,
        replenishmentRecommendationCount: 4,
        recommendationAcceptanceRate:
          overrides.replenishmentAcceptanceRate ?? "75.00",
        fulfillmentVolume: overrides.fulfillmentVolume ?? 6,
        currency,
      },
      purchaseOrderAnalytics: {
        purchaseOrderCount: 3,
        purchaseOrderValue: overrides.purchaseOrderValue ?? "300.00",
        quantityOrdered: 30,
        quantityReceived: 24,
        receivingRate: "80.00",
        partialReceivingRate: "10.00",
        currency,
        byStatus: [],
      },
      supplierPerformance: {
        supplierCount: 2,
        purchaseOrderCount: 3,
        purchaseVolume: overrides.purchaseOrderValue ?? "300.00",
        averageOnTimeReceivingRate: "90.00",
        currency,
      },
      warehousePerformance: {
        warehouseCount: 2,
        totalThroughput: overrides.warehouseThroughput ?? 120,
        averageInventoryTurnover: "45.00",
        totalTransferVolume: 20,
        totalFulfillmentVolume: overrides.fulfillmentVolume ?? 6,
      },
      transferAnalytics: {
        transferCount: 2,
        transferVolume: 20,
        inTransitCount: 0,
        receivedCount: 2,
        pendingCount: 0,
      },
      replenishmentAnalytics: {
        recommendationCount: 4,
        pendingCount: 1,
        acceptedCount: 3,
        dismissedCount: 0,
        acceptanceRate: overrides.replenishmentAcceptanceRate ?? "75.00",
      },
      receivingAnalytics: {
        totalQuantityOrdered: 30,
        totalQuantityReceived: 24,
        fullyReceivedPurchaseOrderCount: 2,
        partiallyReceivedPurchaseOrderCount: 1,
        receivingRate: "80.00",
        partialReceivingRate: "33.33",
      },
      fulfillmentAnalytics: {
        fulfillmentVolume: overrides.fulfillmentVolume ?? 6,
        shipmentCount: 6,
        shippedCount: 4,
        deliveredCount: 2,
        pendingCount: 0,
      },
    },
  };
}

describe("DashboardReportsService", () => {
  it("builds executive summary KPIs from domain report snapshots", () => {
    const summary = buildExecutiveSummary(buildMockSummaries());

    expect(summary.grossRevenue).toBe("1000.00");
    expect(summary.netRevenue).toBe("950.00");
    expect(summary.orders).toBe(10);
    expect(summary.customers).toBe(5);
    expect(summary.inventoryValue).toBe("5000.00");
    expect(summary.lowStockCount).toBe(2);
    expect(summary.returnRate).toBe("5.00");
    expect(summary.collectionRate).toBe("100.00");
    expect(summary.replenishmentAcceptanceRate).toBe("75.00");
  });

  it("aggregates executive dashboard sections from reporting modules", async () => {
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [{ subtotal: "100.00", total: "100.00" }]);

    const dashboard = await module.dashboardReportsService.getExecutiveDashboard({
      storeId: TEST_STORE_A_ID,
    });

    expect(dashboard.sections).toHaveLength(8);
    expect(dashboard.executiveSummary.orders).toBeGreaterThan(0);
    expect(dashboard.executiveSummary.grossRevenue).not.toBe("0.00");
    expect(
      dashboard.sections.some((section) => section.key === "sales"),
    ).toBe(true);
    expect(
      dashboard.sections.some((section) => section.key === "fulfillment"),
    ).toBe(true);
  });

  it("keeps KPI values consistent with underlying domain reports", async () => {
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [{ subtotal: "200.00", total: "200.00" }]);

    const [dashboard, sales, financial] = await Promise.all([
      module.dashboardReportsService.getExecutiveDashboard({
        storeId: TEST_STORE_A_ID,
      }),
      module.salesReportsService.getSummary({ storeId: TEST_STORE_A_ID }),
      module.financialReportsService.getSummary({ storeId: TEST_STORE_A_ID }),
    ]);

    expect(dashboard.executiveSummary.grossRevenue).toBe(
      financial.metrics.grossRevenue,
    );
    expect(dashboard.executiveSummary.netRevenue).toBe(financial.metrics.netRevenue);
    expect(dashboard.executiveSummary.orders).toBe(sales.metrics.orderCount);
    expect(dashboard.executiveSummary.averageOrderValue).toBe(
      sales.metrics.averageOrderValue,
    );
  });

  it("enforces tenant isolation", async () => {
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [
      { storeId: TEST_STORE_A_ID, subtotal: "100.00", total: "100.00" },
      { storeId: TEST_STORE_B_ID, subtotal: "500.00", total: "500.00" },
    ]);

    const dashboard = await module.dashboardReportsService.getExecutiveDashboard({
      storeId: TEST_STORE_A_ID,
    });

    expect(dashboard.executiveSummary.orders).toBe(2);
    expect(dashboard.executiveSummary.grossRevenue).toBe("200.00");
  });

  it("applies warehouse filters through composed report modules", async () => {
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [{ subtotal: "100.00", total: "100.00" }]);

    const dashboard = await module.dashboardReportsService.getExecutiveDashboard({
      storeId: TEST_STORE_A_ID,
      warehouseIds: [TEST_WAREHOUSE_A_ID],
    });

    expect(dashboard.filter.warehouseIds).toEqual([TEST_WAREHOUSE_A_ID]);
    expect(dashboard.executiveSummary.orders).toBeGreaterThan(0);
  });

  it("paginates flat KPI listings", async () => {
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [{ subtotal: "50.00", total: "50.00" }]);

    const report = await module.dashboardReportsService.getDashboardKPIs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 5,
    });

    expect(report.items).toHaveLength(5);
    expect(report.pagination.totalItems).toBeGreaterThan(5);
    expect(report.pagination.totalPages).toBeGreaterThan(1);
    expect(report.executiveSummary.grossRevenue).toBeDefined();
  });

  it("loads dashboard summaries in parallel within a reasonable duration", async () => {
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [
      { subtotal: "100.00", total: "100.00" },
      { subtotal: "150.00", total: "150.00" },
    ]);

    const startedAt = performance.now();
    await module.dashboardReportsService.getExecutiveDashboard({
      storeId: TEST_STORE_A_ID,
    });
    const elapsedMs = performance.now() - startedAt;

    expect(elapsedMs).toBeLessThan(2000);
  });

  it("publishes reports.dashboard.generated domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryDashboardReportsModule({
      domainEventPublisher: publisher,
    });
    const handler = vi.fn();
    dispatcher.subscribe("reports.dashboard.generated", handler);

    await seedDashboardScenario(module, [{ subtotal: "100.00", total: "100.00" }]);

    await module.dashboardReportsService.getExecutiveDashboard({
      storeId: TEST_STORE_A_ID,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0]?.[0]?.payload.reportKind).toBe("executive");
  });

  it("records dashboard report audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryDashboardReportsModule();

    await seedDashboardScenario(module, [{ subtotal: "100.00", total: "100.00" }]);

    const dashboard = await module.dashboardReportsService.getExecutiveDashboard({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "dashboard_report",
      entityId: TEST_STORE_A_ID,
      action: "generate_executive",
      metadata: { sectionCount: dashboard.sections.length },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.entityType === "dashboard_report")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.action === "generate_executive")).toBe(
      true,
    );
  });

  it("flattens section KPIs for paginated KPI reports", () => {
    const summaries = buildMockSummaries();
    const executiveSummary = buildExecutiveSummary(summaries);
    const sections = [
      {
        key: "executive_overview" as const,
        title: "Executive Overview",
        kpis: [
          {
            key: "gross_revenue",
            label: "Gross Revenue",
            value: executiveSummary.grossRevenue,
            section: "executive_overview" as const,
            currency: "USD",
          },
        ],
      },
    ];

    expect(flattenDashboardKPIs(sections)).toHaveLength(1);
  });
});
