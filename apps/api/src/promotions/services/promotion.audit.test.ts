import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryPromotionModule,
  validPromotionInput,
} from "../testing/promotion-test-utils";

describe("Promotion audit integration", () => {
  it("records promotion create and delete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryPromotionModule();
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
      permission: "promotions:write" as const,
    };

    const promotion = await module.promotionService.createPromotion(
      validPromotionInput(),
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion",
      entityId: promotion.id,
      action: "create",
      metadata: {
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        status: promotion.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    await module.promotionService.softDeletePromotion(
      TEST_STORE_A_ID,
      promotion.id,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion",
      entityId: promotion.id,
      action: "delete",
      metadata: {
        code: promotion.code,
        name: promotion.name,
        status: promotion.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "promotion",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "promotion",
      action: "delete",
    });

    expect(tokens.accessToken).toBeTruthy();
  });
});
