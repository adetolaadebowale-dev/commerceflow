import { describe, expect, it } from "vitest";

import { AUTHORIZATION_ERROR_CODES } from "../errors/authorization-error-codes";
import {
  createAuthorizedRequest,
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
} from "../testing/authorization-test-utils";

const TEST_ORGANIZATION_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("Organization authorization", () => {
  it("allows organization read for store members", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { tokens, user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "staff",
      organizationId: TEST_ORGANIZATION_A_ID,
    });

    const context = await authorizationService.authorizeOrganizationRequest(
      createAuthorizedRequest({ accessToken: tokens.accessToken }),
      TEST_ORGANIZATION_A_ID,
      "organizations:read",
    );

    expect(context.organizationRole).toBe("staff");
    expect(context.permission).toBe("organizations:read");
  });

  it("allows organization write for store owners and admins", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { tokens, user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "owner",
      organizationId: TEST_ORGANIZATION_A_ID,
    });

    const context = await authorizationService.authorizeOrganizationRequest(
      createAuthorizedRequest({ accessToken: tokens.accessToken }),
      TEST_ORGANIZATION_A_ID,
      "organizations:write",
    );

    expect(context.organizationRole).toBe("owner");
  });

  it("denies organization write for staff members", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { tokens, user } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "staff",
      organizationId: TEST_ORGANIZATION_A_ID,
    });

    await expect(
      authorizationService.authorizeOrganizationRequest(
        createAuthorizedRequest({ accessToken: tokens.accessToken }),
        TEST_ORGANIZATION_A_ID,
        "organizations:write",
      ),
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.INSUFFICIENT_PERMISSION,
      status: 403,
    });
  });

  it("denies access when user has no store membership in the organization", async () => {
    const { authService, authorizationService } =
      createMemoryAuthorizationService();
    const { tokens } = await registerStaffUser(authService);

    await expect(
      authorizationService.authorizeOrganizationRequest(
        createAuthorizedRequest({ accessToken: tokens.accessToken }),
        TEST_ORGANIZATION_A_ID,
        "organizations:read",
      ),
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.STORE_ACCESS_DENIED,
      status: 403,
    });
  });
});
