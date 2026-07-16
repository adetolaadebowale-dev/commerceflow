import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { netOrderRevenue } from "../services/financial-aggregation";
import type { FinancialOrderFact } from "../repositories/financial-report.repository";
import {
  createMemoryFinancialReportsModule,
  seedFinancialScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/financial-test-utils";

describe("FinancialReportsService", () => {
  it("calculates revenue metrics from immutable order snapshots", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        discountAmount: "10.00",
        taxAmount: "7.50",
        shippingAmount: "5.00",
        total: "102.50",
        paymentStatus: "paid",
      },
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "50.00",
        discountAmount: "0.00",
        taxAmount: "4.00",
        shippingAmount: "0.00",
        total: "54.00",
        paymentStatus: "paid",
      },
    ]);

    const summary = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.grossRevenue).toBe("150.00");
    expect(summary.metrics.discounts).toBe("10.00");
    expect(summary.metrics.taxes).toBe("11.50");
    expect(summary.metrics.shippingRevenue).toBe("5.00");
    expect(summary.metrics.netRevenue).toBe("156.50");
  });

  it("deducts completed refunds from net revenue", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        total: "100.00",
        paymentStatus: "paid",
        refundAmount: "15.00",
      },
    ]);

    const summary = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.grossRevenue).toBe("100.00");
    expect(summary.metrics.refundTotals).toBe("15.00");
    expect(summary.metrics.netRevenue).toBe("85.00");
  });

  it("aggregates invoice totals and outstanding balances", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        total: "100.00",
        paymentStatus: "paid",
        invoiceStatus: "paid",
      },
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "50.00",
        total: "50.00",
        paymentStatus: "paid",
        invoiceStatus: "issued",
      },
    ]);

    const summary = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.invoiceSummary.invoiceCount).toBe(2);
    expect(summary.invoiceSummary.totalAmount).toBe("150.00");
    expect(summary.invoiceSummary.outstandingAmount).toBe("50.00");
    expect(summary.metrics.outstandingInvoices).toBe("50.00");
    expect(summary.metrics.collectionRate).toBe("66.67");
  });

  it("aggregates payment totals and average payment amount", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        total: "100.00",
        paymentStatus: "paid",
      },
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "50.00",
        total: "50.00",
        paymentStatus: "paid",
      },
    ]);

    const summary = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.paymentSummary.paymentCount).toBe(2);
    expect(summary.paymentSummary.paidAmount).toBe("150.00");
    expect(summary.metrics.averagePaymentAmount).toBe("75.00");
  });

  it("builds tax, discount, and shipping summaries", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        discountAmount: "10.00",
        taxAmount: "8.00",
        shippingAmount: "5.00",
        total: "103.00",
        paymentStatus: "paid",
      },
    ]);

    const summary = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.taxSummary.totalTax).toBe("8.00");
    expect(summary.discountSummary.totalDiscount).toBe("10.00");
    expect(summary.shippingRevenueSummary.totalShipping).toBe("5.00");
  });

  it("paginates payment report rows", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(
      module,
      Array.from({ length: 3 }, (_, index) => ({
        storeId: TEST_STORE_A_ID,
        subtotal: "10.00",
        total: "10.00",
        confirmedAt: `2026-07-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-07-0${index + 1}T12:00:00.000Z`,
        paymentStatus: "paid" as const,
      })),
    );

    const report = await module.financialReportsService.getPaymentReport({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(report.items).toHaveLength(2);
    expect(report.pagination.totalItems).toBe(3);
  });

  it("isolates financial data by store tenant and currency", async () => {
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "100.00",
        total: "100.00",
        currency: "USD",
        paymentStatus: "paid",
      },
      {
        storeId: TEST_STORE_B_ID,
        subtotal: "80.00",
        total: "80.00",
        currency: "GBP",
        paymentStatus: "paid",
      },
    ]);

    const summaryA = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });
    const summaryB = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_B_ID,
    });

    expect(summaryA.metrics.netRevenue).toBe("100.00");
    expect(summaryA.metrics.currency).toBe("USD");
    expect(summaryB.metrics.netRevenue).toBe("80.00");
    expect(summaryB.metrics.currency).toBe("GBP");
  });

  it("publishes reports.financial.generated domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryFinancialReportsModule({
      domainEventPublisher: publisher,
    });
    const handler = vi.fn();
    dispatcher.subscribe("reports.financial.generated", handler);

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "25.00",
        total: "25.00",
        paymentStatus: "paid",
      },
    ]);

    await module.financialReportsService.getSummary({ storeId: TEST_STORE_A_ID });
    await module.financialReportsService.getRevenueTimeline({
      storeId: TEST_STORE_A_ID,
      granularity: "day",
    });
    await module.financialReportsService.getPaymentReport({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });
    await module.financialReportsService.getInvoiceReport({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });
    await module.financialReportsService.getRefundReport({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(handler).toHaveBeenCalledTimes(5);
    expect(handler.mock.calls.map(([event]) => event.payload.reportKind)).toEqual(
      expect.arrayContaining(["summary", "revenue", "payments", "invoices", "refunds"]),
    );
  });

  it("records audit entries for financial report generation", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryFinancialReportsModule();

    await seedFinancialScenario(module, [
      {
        storeId: TEST_STORE_A_ID,
        subtotal: "30.00",
        total: "30.00",
        paymentStatus: "paid",
      },
    ]);

    const summary = await module.financialReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "financial_report",
      entityId: TEST_STORE_A_ID,
      action: "generate_summary",
      metadata: { netRevenue: summary.metrics.netRevenue },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "generate_summary")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.entityType === "financial_report")).toBe(
      true,
    );
  });
});

describe("financial-aggregation", () => {
  it("computes net order revenue after refunds", () => {
    const fact: FinancialOrderFact = {
      orderId: "order-1",
      orderNumber: "ORD-1",
      storeId: TEST_STORE_A_ID,
      orderStatus: "confirmed",
      paymentStatus: "paid",
      currency: "USD",
      subtotal: "100.00",
      discountAmount: "0.00",
      taxAmount: "0.00",
      shippingAmount: "0.00",
      total: "100.00",
      refundTotal: "20.00",
      reportTimestamp: "2026-07-01T12:00:00.000Z",
      createdAt: "2026-07-01T12:00:00.000Z",
    };

    expect(netOrderRevenue(fact)).toBe("80.00");
  });
});
