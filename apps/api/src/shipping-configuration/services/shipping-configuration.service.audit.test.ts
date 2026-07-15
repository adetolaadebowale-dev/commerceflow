import { describe, expect, it, vi } from "vitest";

import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import {
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "@/authorization/testing/authorization-test-utils";
import {
  createMemoryShippingConfigurationModule,
  validShippingMethodInput,
  validShippingZoneInput,
} from "../testing/shipping-configuration-test-utils";

describe("Shipping configuration audit integration", () => {
  it("records shipping zone create, update, and delete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryShippingConfigurationModule();
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
      permission: "shipping-config:write" as const,
    };

    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput(),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_zone",
      entityId: zone.id,
      action: "create",
      metadata: {
        name: zone.name,
        countries: zone.countries,
        status: zone.status,
      },
    });

    const updated = await module.shippingZoneService.updateShippingZone(
      TEST_STORE_A_ID,
      zone.id,
      { name: "Updated Zone" },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_zone",
      entityId: updated.id,
      action: "update",
      metadata: {
        name: updated.name,
        countries: updated.countries,
        status: updated.status,
      },
    });

    await module.shippingZoneService.softDeleteShippingZone(
      TEST_STORE_A_ID,
      zone.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_zone",
      entityId: zone.id,
      action: "delete",
      metadata: {
        name: updated.name,
        countries: updated.countries,
        status: updated.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(3);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "shipping_zone",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "shipping_zone",
      action: "update",
    });
    expect(auditLogRepository.getAll()[2]).toMatchObject({
      entityType: "shipping_zone",
      action: "delete",
    });
  });

  it("records shipping method create, update, and delete audit entries", async () => {
    const auditLogRepository = new MemoryAuditLogRepository();
    const auditService = new AuditService({ auditLogRepository });
    const module = createMemoryShippingConfigurationModule();
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
      permission: "shipping-config:write" as const,
    };

    const zone = await module.shippingZoneService.createShippingZone(
      validShippingZoneInput({ status: "active" }),
    );

    const method = await module.shippingMethodService.createShippingMethod(
      validShippingMethodInput(zone.id),
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_method",
      entityId: method.id,
      action: "create",
      metadata: {
        name: method.name,
        shippingZoneId: method.shippingZoneId,
        carrier: method.carrier,
        flatRate: method.flatRate,
        currency: method.currency,
        status: method.status,
      },
    });

    const updated = await module.shippingMethodService.updateShippingMethod(
      TEST_STORE_A_ID,
      method.id,
      { name: "Express" },
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_method",
      entityId: updated.id,
      action: "update",
      metadata: {
        name: updated.name,
        shippingZoneId: updated.shippingZoneId,
        carrier: updated.carrier,
        flatRate: updated.flatRate,
        currency: updated.currency,
        status: updated.status,
      },
    });

    await module.shippingMethodService.softDeleteShippingMethod(
      TEST_STORE_A_ID,
      method.id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipping_method",
      entityId: method.id,
      action: "delete",
      metadata: {
        name: updated.name,
        shippingZoneId: updated.shippingZoneId,
        carrier: updated.carrier,
        flatRate: updated.flatRate,
        currency: updated.currency,
        status: updated.status,
      },
    });

    await vi.waitFor(() => {
      expect(auditLogRepository.getAll()).toHaveLength(3);
    });

    expect(auditLogRepository.getAll()[0]).toMatchObject({
      entityType: "shipping_method",
      action: "create",
    });
    expect(auditLogRepository.getAll()[1]).toMatchObject({
      entityType: "shipping_method",
      action: "update",
    });
    expect(auditLogRepository.getAll()[2]).toMatchObject({
      entityType: "shipping_method",
      action: "delete",
    });
  });
});
