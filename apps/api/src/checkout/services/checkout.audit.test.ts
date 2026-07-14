import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryCheckoutModule,
  seedCheckoutScenario,
  validCheckoutInput,
} from "../testing/checkout-test-utils";

describe("Checkout audit integration", () => {
  it("records checkout audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryCheckoutModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

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
      permission: "carts:write" as const,
    };

    const { address, cart } = await seedCheckoutScenario(module);
    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      validCheckoutInput({ customerAddressId: address.id }),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "checkout",
      entityId: result.order.id,
      action: "checkout",
      metadata: {
        cartId: result.cart.id,
        orderId: result.order.id,
        customerProfileId: result.order.customerProfileId,
        customerAddressId: address.id,
        itemCount: result.order.items.length,
        subtotal: result.order.subtotal,
        currency: result.order.currency,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "checkout",
      action: "checkout",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });

    expect(tokens.accessToken).toBeTruthy();
  });
});
