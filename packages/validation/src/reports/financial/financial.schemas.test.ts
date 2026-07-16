import { describe, expect, it } from "vitest";

import {
  financialSummaryQuerySchema,
  invoiceReportQuerySchema,
  paymentReportQuerySchema,
  refundReportQuerySchema,
  revenueTimelineQuerySchema,
} from "./financial.schemas";

const STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("financial report query schemas", () => {
  it("validates financial summary query filters", () => {
    const parsed = financialSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
      currency: "USD",
      paymentStatus: "paid",
      invoiceStatus: "issued",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates revenue timeline query with granularity", () => {
    const parsed = revenueTimelineQuerySchema.safeParse({
      storeId: STORE_ID,
      granularity: "week",
      fromDate: "2026-07-01T00:00:00.000Z",
      toDate: "2026-07-31T23:59:59.000Z",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates payment, invoice, and refund report queries", () => {
    expect(
      paymentReportQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        sortBy: "generatedAt",
        sortDirection: "desc",
        paymentStatus: "paid",
      }).success,
    ).toBe(true);

    expect(
      invoiceReportQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 1,
        limit: 20,
        invoiceStatus: "paid",
      }).success,
    ).toBe(true);

    expect(
      refundReportQuerySchema.safeParse({
        storeId: STORE_ID,
        page: 2,
        limit: 50,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid date ranges", () => {
    const parsed = financialSummaryQuerySchema.safeParse({
      storeId: STORE_ID,
      fromDate: "2026-08-01T00:00:00.000Z",
      toDate: "2026-07-01T00:00:00.000Z",
    });

    expect(parsed.success).toBe(false);
  });
});
