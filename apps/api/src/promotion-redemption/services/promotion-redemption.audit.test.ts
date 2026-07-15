import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPromotionRedemptionModule,
  seedCartWithItem,
  validActivePromotionInput,
} from "../testing/promotion-redemption-test-utils";

describe("Promotion redemption audit integration", () => {
  it("records apply and remove audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPromotionRedemptionModule();
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

    const { cart } = await seedCartWithItem(module);
    await module.promotionRepository.create(
      validActivePromotionInput({ code: "AUDIT" }),
    );

    const applied = await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "AUDIT" },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion_redemption",
      entityId: applied.appliedPromotion?.id ?? cart.id,
      action: "apply",
      metadata: {
        cartId: cart.id,
        promotionId: applied.appliedPromotion?.promotionId,
        code: applied.appliedPromotion?.promotionCodeSnapshot,
        discountAmount: applied.discountAmount,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    await module.promotionRedemptionService.removePromotion(
      TEST_STORE_A_ID,
      cart.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion_redemption",
      entityId: cart.id,
      action: "remove",
      metadata: { cartId: cart.id },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "promotion_redemption",
      action: "apply",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "promotion_redemption",
      action: "remove",
    });

    expect(tokens.accessToken).toBeTruthy();
  });
});
