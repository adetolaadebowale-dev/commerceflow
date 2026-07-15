import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryShipmentPackageModule,
  seedPendingShipmentWithPackage,
  TEST_STORE_A_ID,
} from "../testing/shipment-package-test-utils";

describe("Shipment package audit integration", () => {
  it("records shipment package create, update, and delete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryShipmentPackageModule();
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
      permission: "shipments:write" as const,
    };

    const { shipmentPackage } = await seedPendingShipmentWithPackage(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_package",
      entityId: shipmentPackage.id,
      action: "create",
      metadata: {
        shipmentId: shipmentPackage.shipmentId,
        packageNumber: shipmentPackage.packageNumber,
        weight: shipmentPackage.weight,
        weightUnit: shipmentPackage.weightUnit,
      },
    });

    const updated = await module.shipmentPackageService.updatePackage(
      TEST_STORE_A_ID,
      shipmentPackage.id,
      { weight: "6.0" },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_package",
      entityId: updated.id,
      action: "update",
      metadata: {
        shipmentId: updated.shipmentId,
        packageNumber: updated.packageNumber,
        weight: updated.weight,
        weightUnit: updated.weightUnit,
      },
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_package",
      entityId: updated.id,
      action: "delete",
      metadata: {
        shipmentId: updated.shipmentId,
        packageNumber: updated.packageNumber,
        weight: updated.weight,
        weightUnit: updated.weightUnit,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items).toHaveLength(3);
    expect(logs.items.map((entry) => entry.action).sort()).toEqual([
      "create",
      "delete",
      "update",
    ]);
  });
});
