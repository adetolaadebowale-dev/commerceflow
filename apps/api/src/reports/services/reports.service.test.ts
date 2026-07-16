import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { TEST_SESSION_ID } from "@/audit/testing/audit-test-utils";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryReportsModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
} from "../testing/reports-test-utils";

describe("ReportsService", () => {
  it("returns reporting foundation health metadata", async () => {
    const module = createMemoryReportsModule();

    const health = await module.reportsService.getHealth({
      storeId: TEST_STORE_A_ID,
    });

    expect(health.status).toBe("ok");
    expect(health.supportedFeatures).toContain("currency_safe_totals");
    expect(health.supportedFeatures).toContain("timezone_aware_reporting");
  });

  it("returns placeholder dashboard metrics with warehouse filtering", async () => {
    const module = createMemoryReportsModule();

    const dashboard = await module.reportsService.getDashboard({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 1,
      sortBy: "generatedAt",
      sortDirection: "desc",
      groupBy: "warehouseId",
      warehouseIds: [TEST_WAREHOUSE_A_ID],
      currency: "USD",
      timezone: "America/New_York",
    });

    expect(dashboard.storeId).toBe(TEST_STORE_A_ID);
    expect(dashboard.timezone).toBe("America/New_York");
    expect(dashboard.currency).toBe("USD");
    expect(dashboard.metrics.length).toBeGreaterThan(0);
    expect(dashboard.summary.rowCount).toBe(1);
    expect(dashboard.summary.filter.warehouseIds).toEqual([TEST_WAREHOUSE_A_ID]);
  });

  it("isolates dashboard data by store", async () => {
    const module = createMemoryReportsModule();

    const dashboard = await module.reportsService.getDashboard({
      storeId: TEST_STORE_B_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(dashboard.storeId).toBe(TEST_STORE_B_ID);
    expect(dashboard.currency).toBe("GBP");
    expect(dashboard.summary.filter.storeId).toBe(TEST_STORE_B_ID);
  });

  it("publishes reports and dashboard domain events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const module = createMemoryReportsModule({ domainEventPublisher: publisher });
    const handler = vi.fn();
    dispatcher.subscribe("reports.generated", handler);
    dispatcher.subscribe("dashboard.viewed", handler);

    await module.reportsService.getDashboard({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls.map(([event]) => event.eventType)).toEqual(
      expect.arrayContaining(["reports.generated", "dashboard.viewed"]),
    );
  });

  it("records audit entries for dashboard generation and viewing", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryReportsModule();

    const dashboard = await module.reportsService.getDashboard({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      sortBy: "generatedAt",
      sortDirection: "desc",
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "report",
      entityId: TEST_STORE_A_ID,
      action: "generate",
      metadata: { rowCount: dashboard.summary.rowCount },
    });

    auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: "user-1",
      sessionId: TEST_SESSION_ID,
      entityType: "report",
      entityId: TEST_STORE_A_ID,
      action: "view_dashboard",
      metadata: {
        timezone: dashboard.timezone,
        currency: dashboard.currency,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.action === "generate")).toBe(true);
    expect(logs.items.some((entry) => entry.action === "view_dashboard")).toBe(
      true,
    );
  });
});
