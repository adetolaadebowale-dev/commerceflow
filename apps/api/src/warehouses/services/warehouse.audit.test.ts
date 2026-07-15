import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryWarehouseModule,
  validWarehouseInput,
} from "../testing/warehouse-test-utils";

describe("Warehouse audit integration", () => {
  it("records warehouse create and lifecycle audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryWarehouseModule();
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
      permission: "warehouses:write" as const,
    };

    const warehouse = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "AUDIT" }),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse",
      entityId: warehouse.id,
      action: "create",
      metadata: {
        name: warehouse.name,
        code: warehouse.code,
        status: warehouse.status,
        isDefault: warehouse.isDefault,
      },
    });

    const deactivated = await module.warehouseService.createWarehouse(
      validWarehouseInput({ code: "SECONDARY", status: "inactive" }),
    );
    const activated = await module.warehouseService.activateWarehouse(
      TEST_STORE_A_ID,
      deactivated.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse",
      entityId: activated.id,
      action: "activate",
      metadata: {
        name: activated.name,
        code: activated.code,
        status: activated.status,
        isDefault: activated.isDefault,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "warehouse",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "warehouse",
      action: "activate",
    });
  });
});
