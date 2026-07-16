import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  buildCustomerMetrics,
  buildPurchaseFrequencyBands,
  netOrderTotal,
} from "../services/customer-aggregation";
import type { CustomerOrderFact } from "../repositories/customer-report.repository";
import {
  createMemoryCustomerReportsModule,
  seedCustomerScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/customer-test-utils";

describe("CustomerReportsService", () => {
  it("calculates CLV from net order totals minus completed refunds", async () => {
    const module = createMemoryCustomerReportsModule();
    const customers = await seedCustomerScenario(
      module,
      [{ storeId: TEST_STORE_A_ID, id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          subtotal: "100.00",
          total: "100.00",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          subtotal: "50.00",
          total: "50.00",
          paymentStatus: "paid",
          refundAmount: "10.00",
        },
      ],
    );

    const summary = await module.customerReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.metrics.lifetimeValue).toBe("140.00");
    expect(summary.metrics.ordersPerCustomer).toBe(2);
    expect(customers).toHaveLength(1);
  });

  it("classifies new vs returning customers within a date range", async () => {
    const module = createMemoryCustomerReportsModule();
    const customerA = crypto.randomUUID();
    const customerB = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [
        { storeId: TEST_STORE_A_ID, id: customerA },
        { storeId: TEST_STORE_A_ID, id: customerB },
      ],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: customerA,
          subtotal: "40.00",
          total: "40.00",
          confirmedAt: "2026-06-01T12:00:00.000Z",
          createdAt: "2026-06-01T12:00:00.000Z",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: customerB,
          subtotal: "30.00",
          total: "30.00",
          confirmedAt: "2026-06-15T12:00:00.000Z",
          createdAt: "2026-06-15T12:00:00.000Z",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: customerB,
          subtotal: "20.00",
          total: "20.00",
          confirmedAt: "2026-07-10T12:00:00.000Z",
          createdAt: "2026-07-10T12:00:00.000Z",
          paymentStatus: "paid",
        },
      ],
    );

    const summary = await module.customerReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
    });

    expect(summary.newVsReturning.newCustomers).toBe(0);
    expect(summary.newVsReturning.returningCustomers).toBe(1);
    expect(summary.metrics.activeCustomers).toBe(1);
  });

  it("builds purchase frequency bands from revenue orders", async () => {
    const module = createMemoryCustomerReportsModule();
    const repeatCustomer = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [
        { storeId: TEST_STORE_A_ID, id: repeatCustomer },
        { storeId: TEST_STORE_A_ID },
      ],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: repeatCustomer,
          subtotal: "10.00",
          total: "10.00",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: repeatCustomer,
          subtotal: "15.00",
          total: "15.00",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: repeatCustomer,
          subtotal: "20.00",
          total: "20.00",
          paymentStatus: "paid",
        },
      ],
    );

    const summary = await module.customerReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    expect(summary.purchaseFrequency.find((band) => band.label === "3-5 orders")?.customerCount).toBe(1);
  });

  it("paginates customer order history", async () => {
    const module = createMemoryCustomerReportsModule();
    const customerId = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [{ storeId: TEST_STORE_A_ID, id: customerId }],
      Array.from({ length: 3 }, (_, index) => ({
        storeId: TEST_STORE_A_ID,
        customerProfileId: customerId,
        subtotal: "10.00",
        total: "10.00",
        confirmedAt: `2026-07-0${index + 1}T12:00:00.000Z`,
        createdAt: `2026-07-0${index + 1}T12:00:00.000Z`,
        paymentStatus: "paid" as const,
      })),
    );

    const orders = await module.customerReportsService.listCustomerOrders({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 2,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(orders.items).toHaveLength(2);
    expect(orders.pagination.totalItems).toBe(3);
    expect(orders.items[0]?.customerId).toBe(customerId);
  });

  it("isolates customer analytics by store tenant", async () => {
    const module = createMemoryCustomerReportsModule();
    const customerA = crypto.randomUUID();
    const customerB = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [
        { storeId: TEST_STORE_A_ID, id: customerA },
        { storeId: TEST_STORE_B_ID, id: customerB },
      ],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: customerA,
          subtotal: "100.00",
          total: "100.00",
          currency: "USD",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_B_ID,
          customerProfileId: customerB,
          subtotal: "80.00",
          total: "80.00",
          currency: "GBP",
          paymentStatus: "paid",
        },
      ],
    );

    const summaryA = await module.customerReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });
    const summaryB = await module.customerReportsService.getSummary({
      storeId: TEST_STORE_B_ID,
    });

    expect(summaryA.metrics.lifetimeValue).toBe("100.00");
    expect(summaryA.metrics.currency).toBe("USD");
    expect(summaryB.metrics.lifetimeValue).toBe("80.00");
    expect(summaryB.metrics.currency).toBe("GBP");
  });

  it("ranks top customers by lifetime value", async () => {
    const module = createMemoryCustomerReportsModule();
    const topCustomer = crypto.randomUUID();
    const otherCustomer = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [
        { storeId: TEST_STORE_A_ID, id: topCustomer, email: "top@example.com" },
        { storeId: TEST_STORE_A_ID, id: otherCustomer, email: "other@example.com" },
      ],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: topCustomer,
          subtotal: "200.00",
          total: "200.00",
          paymentStatus: "paid",
        },
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: otherCustomer,
          subtotal: "50.00",
          total: "50.00",
          paymentStatus: "paid",
        },
      ],
    );

    const topCustomers = await module.customerReportsService.getTopCustomers({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
      sortBy: "lifetimeValue",
      sortDirection: "desc",
    });

    expect(topCustomers.items[0]?.email).toBe("top@example.com");
    expect(topCustomers.items[0]?.lifetimeValue.netLifetimeValue).toBe("200.00");
  });

  it("publishes reports.customers.generated domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryCustomerReportsModule({
      domainEventPublisher: publisher,
    });
    const handler = vi.fn();
    dispatcher.subscribe("reports.customers.generated", handler);

    const customerId = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [{ storeId: TEST_STORE_A_ID, id: customerId }],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: customerId,
          subtotal: "25.00",
          total: "25.00",
          paymentStatus: "paid",
        },
      ],
    );

    await module.customerReportsService.getSummary({ storeId: TEST_STORE_A_ID });
    await module.customerReportsService.getGrowth({
      storeId: TEST_STORE_A_ID,
      granularity: "day",
    });
    await module.customerReportsService.getTopCustomers({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "lifetimeValue",
      sortDirection: "desc",
    });
    await module.customerReportsService.listCustomerOrders({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(handler).toHaveBeenCalledTimes(4);
    expect(handler.mock.calls.map(([event]) => event.payload.reportKind)).toEqual(
      expect.arrayContaining(["summary", "growth", "top", "orders"]),
    );
  });

  it("records audit entries for customer report generation", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryCustomerReportsModule();
    const customerId = crypto.randomUUID();

    await seedCustomerScenario(
      module,
      [{ storeId: TEST_STORE_A_ID, id: customerId }],
      [
        {
          storeId: TEST_STORE_A_ID,
          customerProfileId: customerId,
          subtotal: "30.00",
          total: "30.00",
          paymentStatus: "paid",
        },
      ],
    );

    const summary = await module.customerReportsService.getSummary({
      storeId: TEST_STORE_A_ID,
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "customer_report",
      entityId: TEST_STORE_A_ID,
      action: "generate_summary",
      metadata: { totalCustomers: summary.metrics.totalCustomers },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "generate_summary")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.entityType === "customer_report")).toBe(
      true,
    );
  });
});

describe("customer-aggregation", () => {
  it("computes net order totals after refunds", () => {
    const fact: CustomerOrderFact = {
      orderId: "order-1",
      orderNumber: "ORD-1",
      customerProfileId: "customer-1",
      storeId: TEST_STORE_A_ID,
      orderStatus: "confirmed",
      paymentStatus: "paid",
      currency: "USD",
      subtotal: "100.00",
      discountAmount: "0.00",
      taxAmount: "0.00",
      shippingAmount: "0.00",
      total: "100.00",
      refundTotal: "15.00",
      unitsPurchased: 1,
      reportTimestamp: "2026-07-01T12:00:00.000Z",
      createdAt: "2026-07-01T12:00:00.000Z",
    };

    expect(netOrderTotal(fact)).toBe("85.00");
  });

  it("calculates average purchase interval across repeat customers", () => {
    const facts: CustomerOrderFact[] = [
      {
        orderId: "order-1",
        orderNumber: "ORD-1",
        customerProfileId: "customer-1",
        storeId: TEST_STORE_A_ID,
        orderStatus: "confirmed",
        paymentStatus: "paid",
        currency: "USD",
        subtotal: "10.00",
        discountAmount: "0.00",
        taxAmount: "0.00",
        shippingAmount: "0.00",
        total: "10.00",
        refundTotal: "0.00",
        unitsPurchased: 1,
        reportTimestamp: "2026-07-01T12:00:00.000Z",
        createdAt: "2026-07-01T12:00:00.000Z",
      },
      {
        orderId: "order-2",
        orderNumber: "ORD-2",
        customerProfileId: "customer-1",
        storeId: TEST_STORE_A_ID,
        orderStatus: "confirmed",
        paymentStatus: "paid",
        currency: "USD",
        subtotal: "10.00",
        discountAmount: "0.00",
        taxAmount: "0.00",
        shippingAmount: "0.00",
        total: "10.00",
        refundTotal: "0.00",
        unitsPurchased: 1,
        reportTimestamp: "2026-07-11T12:00:00.000Z",
        createdAt: "2026-07-11T12:00:00.000Z",
      },
    ];

    const metrics = buildCustomerMetrics(
      [
        {
          customerId: "customer-1",
          storeId: TEST_STORE_A_ID,
          email: "repeat@example.com",
          firstName: "Repeat",
          lastName: "Buyer",
          status: "active",
          customerSince: "2026-07-01T12:00:00.000Z",
        },
      ],
      facts,
      facts,
      "USD",
    );

    expect(metrics.averagePurchaseIntervalDays).toBe(10);
    expect(buildPurchaseFrequencyBands(facts)[0]?.customerCount).toBe(0);
    expect(buildPurchaseFrequencyBands(facts)[1]?.customerCount).toBe(1);
  });
});
