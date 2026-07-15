import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryInventoryAllocationModule,
  seedPickingAllocation,
  TEST_STORE_A_ID,
} from "../testing/inventory-allocation-test-utils";

describe("Inventory allocation audit integration", () => {
  it("records allocate, update, and report_shortage audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryInventoryAllocationModule();
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

    const { allocation } = await seedPickingAllocation(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_allocation",
      entityId: allocation.id,
      action: "allocate",
      metadata: {
        pickListItemId: allocation.pickListItemId,
        inventoryItemId: allocation.inventoryItemId,
        status: allocation.status,
        quantityAllocated: allocation.quantityAllocated,
        quantityPicked: allocation.quantityPicked,
      },
    });

    const updated = await module.inventoryAllocationService.updatePickedQuantity(
      TEST_STORE_A_ID,
      allocation.id,
      { quantityPicked: 1 },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_allocation",
      entityId: updated.id,
      action: "update",
      metadata: {
        pickListItemId: updated.pickListItemId,
        inventoryItemId: updated.inventoryItemId,
        status: updated.status,
        quantityAllocated: updated.quantityAllocated,
        quantityPicked: updated.quantityPicked,
      },
    });

    const shortage = await module.inventoryAllocationService.reportShortage(
      TEST_STORE_A_ID,
      allocation.id,
      { shortageReason: "Damaged goods" },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_allocation",
      entityId: shortage.id,
      action: "report_shortage",
      metadata: {
        pickListItemId: shortage.pickListItemId,
        inventoryItemId: shortage.inventoryItemId,
        status: shortage.status,
        quantityAllocated: shortage.quantityAllocated,
        quantityPicked: shortage.quantityPicked,
        shortageReason: shortage.shortageReason,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items).toHaveLength(3);
    expect(logs.items.map((entry) => entry.action).sort()).toEqual([
      "allocate",
      "report_shortage",
      "update",
    ]);
  });
});
