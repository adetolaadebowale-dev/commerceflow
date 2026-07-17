import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryWebhookModule,
  TEST_STORE_A_ID,
  validCreateWebhookInput,
} from "../testing/webhook-test-utils";

describe("Webhook audit integration", () => {
  it("records webhook create and update audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryWebhookModule();
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
      permission: "webhooks:write" as const,
    };

    const created = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "webhook",
      entityId: created.id,
      action: "create",
      metadata: { webhookId: created.id, url: created.url },
    });

    const updated = await module.webhookService.updateWebhook(
      TEST_STORE_A_ID,
      created.id,
      { enabled: false },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "webhook",
      entityId: updated.id,
      action: "update",
      metadata: { webhookId: updated.id, enabled: updated.enabled },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(2);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "webhook",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "webhook",
      action: "update",
    });
  });

  it("records webhook deliver audit entries on delivery attempts", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const fetchImpl = vi.fn(async () => new Response("ok", { status: 200 }));
    const module = createMemoryWebhookModule({ fetchImpl, auditService });

    const webhook = await module.webhookService.createWebhook(
      validCreateWebhookInput(),
    );
    const endpoint = await module.webhookRepository.findEndpointWithSecret(
      webhook.storeId,
      webhook.id,
    );

    await module.webhookDeliveryService.deliverToEndpoint(
      endpoint!,
      "order.confirmed",
      { orderId: "order-1" },
    );

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(1);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "webhook",
      action: "deliver",
      storeId: TEST_STORE_A_ID,
    });
  });
});
