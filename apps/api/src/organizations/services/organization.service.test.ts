import { describe, expect, it } from "vitest";

import { ORGANIZATION_ERROR_CODES } from "../errors";
import {
  createMemoryOrganizationModule,
  seedOrganizationWithStore,
  TEST_ORGANIZATION_A_ID,
  TEST_ORGANIZATION_B_ID,
} from "../testing/organization-test-utils";

describe("OrganizationService", () => {
  it("retrieves organization details with settings placeholder", async () => {
    const module = createMemoryOrganizationModule();
    seedOrganizationWithStore(module.organizationRepository);

    const organization = await module.organizationService.getOrganization(
      TEST_ORGANIZATION_A_ID,
    );

    expect(organization).toMatchObject({
      id: TEST_ORGANIZATION_A_ID,
      name: "Acme Commerce",
      slug: "acme-commerce",
      settings: {},
    });
  });

  it("updates organization profile fields", async () => {
    const module = createMemoryOrganizationModule();
    seedOrganizationWithStore(module.organizationRepository);

    const organization = await module.organizationService.updateOrganization(
      TEST_ORGANIZATION_A_ID,
      {
        name: "Acme Retail Group",
        slug: "acme-retail-group",
      },
    );

    expect(organization.name).toBe("Acme Retail Group");
    expect(organization.slug).toBe("acme-retail-group");
  });

  it("rejects duplicate slug updates", async () => {
    const module = createMemoryOrganizationModule();
    seedOrganizationWithStore(module.organizationRepository, {
      organizationId: TEST_ORGANIZATION_A_ID,
      organizationSlug: "acme-commerce",
    });
    seedOrganizationWithStore(module.organizationRepository, {
      organizationId: TEST_ORGANIZATION_B_ID,
      organizationSlug: "other-org",
      storeId: "22222222-2222-2222-2222-222222222222",
    });

    await expect(
      module.organizationService.updateOrganization(TEST_ORGANIZATION_A_ID, {
        slug: "other-org",
      }),
    ).rejects.toMatchObject({
      code: ORGANIZATION_ERROR_CODES.SLUG_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("lists stores for an organization", async () => {
    const module = createMemoryOrganizationModule();
    seedOrganizationWithStore(module.organizationRepository);

    const stores = await module.organizationService.listOrganizationStores(
      TEST_ORGANIZATION_A_ID,
    );

    expect(stores).toHaveLength(1);
    expect(stores[0]).toMatchObject({
      organizationId: TEST_ORGANIZATION_A_ID,
      slug: "main-store",
    });
  });

  it("returns not found for unknown organizations", async () => {
    const module = createMemoryOrganizationModule();

    await expect(
      module.organizationService.getOrganization(TEST_ORGANIZATION_A_ID),
    ).rejects.toMatchObject({
      code: ORGANIZATION_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});
