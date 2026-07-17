import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryOrganizationModule,
  seedOrganizationWithStore,
  TEST_ORGANIZATION_A_ID,
} from "../testing/organization-test-utils";

describe("OrganizationService domain events", () => {
  it("emits organization.updated when profile changes", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("organization.updated", handler);

    const module = createMemoryOrganizationModule({
      domainEventPublisher: publisher,
    });
    seedOrganizationWithStore(module.organizationRepository);

    const organization = await module.organizationService.updateOrganization(
      TEST_ORGANIZATION_A_ID,
      { name: "Updated Organization Name" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "organization.updated",
      aggregateId: organization.id,
      storeId: null,
      payload: {
        organizationId: organization.id,
        previousName: "Acme Commerce",
        organization: expect.objectContaining({
          name: "Updated Organization Name",
        }),
      },
    });
  });
});
