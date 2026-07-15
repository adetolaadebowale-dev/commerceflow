import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryShipmentModule,
  createPackedShipment,
  createPendingShipment,
  TEST_STORE_A_ID,
} from "../testing/shipment-test-utils";

describe("Shipment audit integration", () => {
  it("records shipment create and lifecycle audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryShipmentModule();
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

    const { shipment: pending } = await createPendingShipment(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment",
      entityId: pending.id,
      action: "create",
      metadata: {
        orderId: pending.orderId,
        shipmentNumber: pending.shipmentNumber,
        status: pending.status,
      },
    });

    const packed = await module.shipmentService.packShipment(
      { storeId: TEST_STORE_A_ID },
      pending.id,
    );
    const shipped = await module.shipmentService.shipShipment(
      { storeId: TEST_STORE_A_ID },
      packed.id,
    );

    auditService.recordFromAuthContext(
      { ...authContext, permission: "shipments:lifecycle" },
      {
        entityType: "shipment",
        entityId: shipped.id,
        action: "ship",
        metadata: {
          orderId: shipped.orderId,
          shipmentNumber: shipped.shipmentNumber,
          status: shipped.status,
        },
      },
    );

    const delivered = await module.shipmentService.deliverShipment(
      { storeId: TEST_STORE_A_ID },
      shipped.id,
    );

    auditService.recordFromAuthContext(
      { ...authContext, permission: "shipments:lifecycle" },
      {
        entityType: "shipment",
        entityId: delivered.id,
        action: "deliver",
        metadata: {
          orderId: delivered.orderId,
          shipmentNumber: delivered.shipmentNumber,
          status: delivered.status,
        },
      },
    );

    const cancelModule = createMemoryShipmentModule();
    const { shipment: cancellable } = await createPackedShipment(cancelModule);
    const cancelled = await cancelModule.shipmentService.cancelShipment(
      { storeId: TEST_STORE_A_ID },
      cancellable.id,
    );

    auditService.recordFromAuthContext(
      { ...authContext, permission: "shipments:lifecycle" },
      {
        entityType: "shipment",
        entityId: cancelled.id,
        action: "cancel",
        metadata: {
          orderId: cancelled.orderId,
          shipmentNumber: cancelled.shipmentNumber,
          status: cancelled.status,
        },
      },
    );

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(logs.items.map((log) => log.action).sort()).toEqual([
      "cancel",
      "create",
      "deliver",
      "ship",
    ]);
    expect(logs.items.every((log) => log.entityType === "shipment")).toBe(true);
  });
});
