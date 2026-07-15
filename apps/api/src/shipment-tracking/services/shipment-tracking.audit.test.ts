import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryShipmentTrackingModule,
  createSampleTrackingEvent,
  TEST_STORE_A_ID,
} from "../testing/shipment-tracking-test-utils";

describe("Shipment tracking audit integration", () => {
  it("records shipment tracking event create audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryShipmentTrackingModule();
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

    const { trackingEvent } = await createSampleTrackingEvent(module);

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_tracking_event",
      entityId: trackingEvent.id,
      action: "create",
      metadata: {
        shipmentId: trackingEvent.shipmentId,
        eventType: trackingEvent.eventType,
        statusSnapshot: trackingEvent.statusSnapshot,
        description: trackingEvent.description,
      },
    });

    const logs = await auditLogRepository.list({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 10,
    });

    expect(logs.items).toHaveLength(1);
    expect(logs.items[0]).toMatchObject({
      entityType: "shipment_tracking_event",
      entityId: trackingEvent.id,
      action: "create",
    });
  });
});
