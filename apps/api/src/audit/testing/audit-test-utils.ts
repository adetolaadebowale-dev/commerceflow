import type { AuditLog } from "@commerceflow/types";

import { MemoryAuditLogRepository } from "../repositories/memory-audit-log.repository";
import { AuditService } from "../services/audit.service";

export const TEST_STORE_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const TEST_STORE_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
export const TEST_USER_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
export const TEST_SESSION_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

export function createMemoryAuditService(options?: {
  onRecordFailure?: (error: unknown) => void;
}) {
  const auditLogRepository = new MemoryAuditLogRepository();
  const failures: unknown[] = [];

  const auditService = new AuditService({
    auditLogRepository,
    onRecordFailure: (error) => {
      failures.push(error);
      options?.onRecordFailure?.(error);
    },
  });

  return { auditService, auditLogRepository, failures };
}

export function validAuditLogInput(
  overrides: Partial<AuditLog> = {},
): AuditLog {
  return {
    id: crypto.randomUUID(),
    storeId: TEST_STORE_A_ID,
    userId: TEST_USER_ID,
    sessionId: TEST_SESSION_ID,
    entityType: "order",
    entityId: crypto.randomUUID(),
    action: "confirm",
    metadata: { orderNumber: "ORD-001" },
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
