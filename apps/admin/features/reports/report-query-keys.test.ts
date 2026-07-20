import { describe, expect, it } from "vitest";

import { toReportDateRange } from "@/features/reports/report-query-keys";

describe("toReportDateRange", () => {
  it("returns empty range for all-time", () => {
    expect(toReportDateRange("all")).toEqual({});
  });

  it("returns ISO from/to for rolling presets", () => {
    const range = toReportDateRange("7d");
    expect(range.fromDate).toBeTruthy();
    expect(range.toDate).toBeTruthy();
    expect(new Date(range.fromDate!).getTime()).toBeLessThan(
      new Date(range.toDate!).getTime(),
    );
  });
});
