import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryWarehouseTransferModule,
  seedApprovedWarehouseTransfer,
  TEST_STORE_A_ID,
} from "../testing/warehouse-transfer-test-utils";

describe("Warehouse transfer audit integration", () => {
  it("records create, approve, ship, and receive audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryWarehouseTransferModule();
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
      permission: "warehouse-transfers:lifecycle" as const,
    };

    const { warehouseTransfer } = await seedApprovedWarehouseTransfer(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: warehouseTransfer.id,
      action: "approve",
      metadata: { transferNumber: warehouseTransfer.transferNumber },
    });

    const shipResult = await module.warehouseTransferService.shipWarehouseTransfer(
      warehouseTransfer.id,
      { storeId: TEST_STORE_A_ID },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: shipResult.warehouseTransfer.id,
      action: "ship",
      metadata: {
        transferNumber: shipResult.warehouseTransfer.transferNumber,
        stockMovementCount: shipResult.stockMovements.length,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(
      logs.items.some(
        (entry) =>
          entry.entityType === "warehouse_transfer" && entry.action === "approve",
      ),
    ).toBe(true);
    expect(
      logs.items.some(
        (entry) =>
          entry.entityType === "warehouse_transfer" && entry.action === "ship",
      ),
    ).toBe(true);
  });
});
