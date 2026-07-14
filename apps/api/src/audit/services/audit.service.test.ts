import { describe, expect, it } from "vitest";

import { AUDIT_ERROR_CODES } from "../errors";
import {
  createMemoryAuditService,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SESSION_ID,
  TEST_USER_ID,
  validAuditLogInput,
} from "../testing/audit-test-utils";

describe("AuditService", () => {
  it("records an immutable audit log entry", async () => {
    const { auditService, auditLogRepository } = createMemoryAuditService();

    const log = await auditService.record({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_ID,
      sessionId: TEST_SESSION_ID,
      entityType: "brand",
      entityId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      action: "create",
      metadata: { name: "Acme" },
    });

    expect(log).toMatchObject({
      storeId: TEST_STORE_A_ID,
      userId: TEST_USER_ID,
      entityType: "brand",
      action: "create",
    });
    expect(auditLogRepository.getAll()).toHaveLength(1);
  });

  it("lists audit logs with store-scoped tenant isolation", async () => {
    const { auditService, auditLogRepository } = createMemoryAuditService();

    auditLogRepository.seedLog(
      validAuditLogInput({ storeId: TEST_STORE_A_ID }),
    );
    auditLogRepository.seedLog(
      validAuditLogInput({ storeId: TEST_STORE_B_ID }),
    );

    const result = await auditService.listAuditLogs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.storeId).toBe(TEST_STORE_A_ID);
  });

  it("filters audit logs by entity type and action", async () => {
    const { auditService, auditLogRepository } = createMemoryAuditService();

    auditLogRepository.seedLog(
      validAuditLogInput({ entityType: "order", action: "confirm" }),
    );
    auditLogRepository.seedLog(
      validAuditLogInput({ entityType: "order", action: "cancel" }),
    );

    const result = await auditService.listAuditLogs({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
      entityType: "order",
      action: "confirm",
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.action).toBe("confirm");
  });

  it("returns a store-scoped audit log by id", async () => {
    const { auditService, auditLogRepository } = createMemoryAuditService();
    const seeded = validAuditLogInput();
    auditLogRepository.seedLog(seeded);

    const log = await auditService.getAuditLog(TEST_STORE_A_ID, seeded.id);
    expect(log.id).toBe(seeded.id);
  });

  it("rejects cross-store audit log access", async () => {
    const { auditService, auditLogRepository } = createMemoryAuditService();
    const seeded = validAuditLogInput({ storeId: TEST_STORE_A_ID });
    auditLogRepository.seedLog(seeded);

    await expect(
      auditService.getAuditLog(TEST_STORE_B_ID, seeded.id),
    ).rejects.toMatchObject({
      code: AUDIT_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("does not throw when best-effort recording fails", async () => {
    const { auditService, auditLogRepository, failures } =
      createMemoryAuditService();

    auditLogRepository.setCreateFailure(new Error("audit write failed"));

    await expect(
      auditService.recordBestEffort({
        storeId: TEST_STORE_A_ID,
        userId: TEST_USER_ID,
        sessionId: TEST_SESSION_ID,
        entityType: "order",
        entityId: crypto.randomUUID(),
        action: "confirm",
      }),
    ).resolves.toBeUndefined();

    expect(failures).toHaveLength(1);
  });
});
