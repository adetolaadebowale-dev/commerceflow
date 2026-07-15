import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPickListModule,
  fullyPickedItems,
  seedPendingPickList,
  TEST_STORE_A_ID,
} from "../testing/pick-list-test-utils";

describe("Pick list audit integration", () => {
  it("records pick list create, start, complete, and pack audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPickListModule();
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
      permission: "shipments:lifecycle" as const,
    };

    const { pickList } = await seedPendingPickList(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: pickList.id,
      action: "create",
      metadata: { shipmentId: pickList.shipmentId, status: pickList.status },
    });

    const started = await module.pickListService.startPicking(
      TEST_STORE_A_ID,
      pickList.id,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: started.id,
      action: "start",
      metadata: { shipmentId: started.shipmentId, status: started.status },
    });

    const picked = await module.pickListService.completePicking(
      TEST_STORE_A_ID,
      pickList.id,
      fullyPickedItems(pickList),
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: picked.id,
      action: "complete",
      metadata: { shipmentId: picked.shipmentId, status: picked.status },
    });

    const packed = await module.pickListService.markPacked(
      TEST_STORE_A_ID,
      pickList.id,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: packed.id,
      action: "pack",
      metadata: { shipmentId: packed.shipmentId, status: packed.status },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items).toHaveLength(4);
    expect(logs.items.map((entry) => entry.action).sort()).toEqual([
      "complete",
      "create",
      "pack",
      "start",
    ]);
  });
});
