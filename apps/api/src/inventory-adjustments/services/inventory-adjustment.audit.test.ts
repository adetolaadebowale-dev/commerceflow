import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryInventoryAdjustmentModule,
  seedInventoryItemForAdjustments,
  TEST_STORE_A_ID,
} from "../testing/inventory-adjustment-test-utils";

const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";

describe("Inventory adjustment audit integration", () => {
  it("records create audit entries for adjustment and stock movement", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryInventoryAdjustmentModule();
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

    const { inventoryItem } = await seedInventoryItemForAdjustments(module);

    const result = await module.inventoryAdjustmentService.createAdjustment(
      {
        storeId: TEST_STORE_A_ID,
        inventoryItemId: inventoryItem.id,
        movementQuantity: 1,
        reason: "Audit test",
      },
      TEST_USER_ID,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_adjustment",
      entityId: result.adjustment.id,
      action: "create",
      metadata: {
        adjustmentNumber: result.adjustment.adjustmentNumber,
        movementQuantity: result.adjustment.movementQuantity,
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "stock_movement",
      entityId: result.stockMovement.id,
      action: "create",
      metadata: {
        movementType: result.stockMovement.movementType,
        quantity: result.stockMovement.quantity,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(logs.items.some((entry) => entry.entityType === "inventory_adjustment")).toBe(
      true,
    );
    expect(logs.items.some((entry) => entry.entityType === "stock_movement")).toBe(
      true,
    );
  });
});
