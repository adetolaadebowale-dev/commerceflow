import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryCartModule,
  seedCustomerAndVariant,
  TEST_VARIANT_A_ID,
  validCartInput,
} from "../testing/cart-test-utils";

describe("Cart audit integration", () => {
  it("records cart and cart item audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
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

    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );
    const cart = await cartService.createCart(validCartInput({ customerId }));
    auditService.recordFromAuthContext(authContext, {
      entityType: "cart",
      entityId: cart.id,
      action: "create",
      metadata: {
        customerId: cart.customerId,
        status: cart.status,
        itemCount: cart.items.length,
      },
    });

    const withItem = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
    });
    auditService.recordFromAuthContext(authContext, {
      entityType: "cart_item",
      entityId: withItem.items[0]!.id,
      action: "create",
      metadata: {
        cartId: withItem.id,
        productVariantId: TEST_VARIANT_A_ID,
        quantity: 2,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "cart",
      action: "create",
      storeId: TEST_STORE_A_ID,
      userId: user.id,
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "cart_item",
      action: "create",
    });

    expect(tokens.accessToken).toBeTruthy();
  });
});
