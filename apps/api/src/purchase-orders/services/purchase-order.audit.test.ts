import { describe, expect, it } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPurchaseOrderModule,
  seedOrderedPurchaseOrder,
  TEST_STORE_A_ID,
} from "../testing/purchase-order-test-utils";

describe("Purchase order audit integration", () => {
  it("records approve, order, and receive audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPurchaseOrderModule();
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
      permission: "purchase-orders:lifecycle" as const,
    };

    const { purchaseOrder } = await seedOrderedPurchaseOrder(module);
    const item = purchaseOrder.items[0]!;

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      action: "order",
      metadata: { purchaseOrderNumber: purchaseOrder.purchaseOrderNumber },
    });

    const result = await module.purchaseOrderService.receivePurchaseOrder(
      purchaseOrder.id,
      {
        storeId: TEST_STORE_A_ID,
        items: [{ purchaseOrderItemId: item.id, quantityReceived: 2 }],
      },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: result.purchaseOrder.id,
      action: "receive",
      metadata: {
        purchaseOrderNumber: result.purchaseOrder.purchaseOrderNumber,
        stockMovementCount: result.stockMovements.length,
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
          entry.entityType === "purchase_order" && entry.action === "order",
      ),
    ).toBe(true);
    expect(
      logs.items.some(
        (entry) =>
          entry.entityType === "purchase_order" && entry.action === "receive",
      ),
    ).toBe(true);
  });
});
