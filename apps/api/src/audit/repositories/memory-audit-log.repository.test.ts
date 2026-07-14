import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "../repositories/memory-audit-log.repository";
import {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SESSION_ID,
  TEST_USER_ID,
  validAuditLogInput,
} from "../testing/audit-test-utils";

describe("MemoryAuditLogRepository", () => {
  it("appends audit logs without update or delete operations", async () => {
    const repository = new MemoryAuditLogRepository();

    const created = await repository.create({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_ID,
      sessionId: TEST_SESSION_ID,
      entityType: "inventory_item",
      entityId: crypto.randomUUID(),
      action: "create",
      metadata: { quantityOnHand: 10 },
    });

    expect(created.id).toBeTruthy();
    expect(repository.getAll()).toHaveLength(1);
    expect(repository).not.toHaveProperty("update");
    expect(repository).not.toHaveProperty("delete");
  });

  it("enforces tenant isolation on findById", async () => {
    const repository = new MemoryAuditLogRepository();
    const seeded = validAuditLogInput({ storeId: TEST_STORE_A_ID });
    repository.seedLog(seeded);

    await expect(
      repository.findById(TEST_STORE_B_ID, seeded.id),
    ).resolves.toBeNull();
  });
});
