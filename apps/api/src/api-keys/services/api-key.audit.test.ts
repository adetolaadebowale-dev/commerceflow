import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryApiKeyModule,
  TEST_STORE_A_ID,
  validCreateApiKeyInput,
} from "../testing/api-key-test-utils";

describe("API key audit integration", () => {
  it("records api_key create and revoke audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryApiKeyModule();
    const { authService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "owner",
    });

    const authContext = {
      userId: user.id,
      sessionId: "session-id",
      storeId: TEST_STORE_A_ID,
      storeRole: "owner" as const,
      permission: "api-keys:write" as const,
    };

    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "api_key",
      entityId: created.id,
      action: "create",
      metadata: {
        apiKeyId: created.id,
        name: created.name,
        keyPrefix: created.keyPrefix,
      },
    });

    const revoked = await module.apiKeyService.revokeApiKey(
      TEST_STORE_A_ID,
      created.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "api_key",
      entityId: revoked.id,
      action: "revoke",
      metadata: {
        apiKeyId: revoked.id,
        name: revoked.name,
        keyPrefix: revoked.keyPrefix,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "api_key",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "api_key",
      action: "revoke",
    });
  });
});
