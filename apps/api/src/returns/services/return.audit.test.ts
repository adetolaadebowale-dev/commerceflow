import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryReturnModule,
  seedInspectedReturn,
  TEST_STORE_A_ID,
} from "../testing/return-test-utils";

describe("Return audit integration", () => {
  it("records create, receive, inspect, and complete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryReturnModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "manager",
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "manager" as const,
      permission: "inventory:write" as const,
    };

    const { returnRecord, returnItem } = await seedInspectedReturn(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: returnRecord.id,
      action: "create",
      metadata: {
        orderId: returnRecord.orderId,
        shipmentId: returnRecord.shipmentId,
        returnNumber: returnRecord.returnNumber,
        status: returnRecord.status,
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: returnRecord.id,
      action: "inspect",
      metadata: {
        orderId: returnRecord.orderId,
        shipmentId: returnRecord.shipmentId,
        returnNumber: returnRecord.returnNumber,
        status: returnRecord.status,
      },
    });

    const result = await module.returnService.completeReturn(returnRecord.id, {
      storeId: TEST_STORE_A_ID,
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: result.return.id,
      action: "complete",
      metadata: {
        orderId: result.return.orderId,
        shipmentId: result.return.shipmentId,
        returnNumber: result.return.returnNumber,
        status: result.return.status,
        stockMovementCount: result.stockMovements.length,
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: returnRecord.id,
      action: "receive",
      metadata: {
        returnItemId: returnItem.id,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.entityType === "return" && entry.action === "create")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.action === "receive")).toBe(true);
    expect(logs.items.some((entry) => entry.action === "inspect")).toBe(true);
    expect(logs.items.some((entry) => entry.action === "complete")).toBe(true);
  });
});
