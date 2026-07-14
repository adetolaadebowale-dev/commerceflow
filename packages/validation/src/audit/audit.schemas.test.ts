import { describe, expect, it } from "vitest";

import {
  auditLogIdQuerySchema,
  listAuditLogsQuerySchema,
} from "./audit.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("audit schemas", () => {
  it("validates audit log list query", () => {
    const parsed = listAuditLogsQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
      page: 1,
      limit: 20,
      entityType: "order",
      action: "confirm",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects audit log list query without storeId", () => {
    const parsed = listAuditLogsQuerySchema.safeParse({
      page: 1,
    });

    expect(parsed.success).toBe(false);
  });

  it("validates audit log id query", () => {
    const parsed = auditLogIdQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
    });

    expect(parsed.success).toBe(true);
  });
});
