import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryShipmentFulfillmentModule,
  seedPackedShipmentWithAllocations,
  TEST_STORE_A_ID,
} from "../testing/fulfillment-test-utils";

describe("Fulfillment shipment audit integration", () => {
  it("records shipment fulfill and stock movement create audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryShipmentFulfillmentModule();
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

    const { shipment } = await seedPackedShipmentWithAllocations(module);

    const result = await module.fulfillmentService.fulfillShipment(
      { storeId: TEST_STORE_A_ID },
      shipment.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment",
      entityId: result.shipment.id,
      action: "fulfill",
      metadata: {
        shipmentNumber: result.shipment.shipmentNumber,
        stockMovementCount: result.stockMovements.length,
        allocationCount: result.allocations.length,
      },
    });

    for (const stockMovement of result.stockMovements) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "stock_movement",
        entityId: stockMovement.id,
        action: "create",
        metadata: {
          inventoryItemId: stockMovement.inventoryItemId,
          movementType: stockMovement.movementType,
          quantity: stockMovement.quantity,
          shipmentId: stockMovement.shipmentId,
        },
      });
    }

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items.some((entry) => entry.entityType === "shipment" && entry.action === "fulfill")).toBe(
      true,
    );
    expect(
      logs.items.some(
        (entry) =>
          entry.entityType === "stock_movement" && entry.action === "create",
      ),
    ).toBe(true);
  });
});
