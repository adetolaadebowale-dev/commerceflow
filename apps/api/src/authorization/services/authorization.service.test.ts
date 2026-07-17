import { describe, expect, it } from "vitest";

import { AUTH_ERROR_CODES } from "../../auth/errors";
import { AUTHORIZATION_ERROR_CODES } from "../errors";
import {
  createAuthorizedRequest,
  createMemoryAuthorizationService,
  registerStaffUser,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/authorization-test-utils";

describe("AuthorizationService", () => {
  it("authorizes a store member with the required permission", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "manager",
    });

    const context = await authorizationService.authorizeStoreRequest(
      createAuthorizedRequest({
        accessToken: tokens.accessToken,
        storeId: TEST_STORE_A_ID,
      }),
      TEST_STORE_A_ID,
      "catalogue:write",
    );

    expect(context).toMatchObject({
      userId: user.id,
      storeId: TEST_STORE_A_ID,
      storeRole: "manager",
      permission: "catalogue:write",
    });
  });

  it("rejects unauthenticated requests", async () => {
    const { authorizationService } = createMemoryAuthorizationService();

    await expect(
      authorizationService.authorizeStoreRequest(
        new Request("http://localhost/api/test"),
        TEST_STORE_A_ID,
        "catalogue:read",
      ),
    ).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.UNAUTHENTICATED,
      status: 401,
    });
  });

  it("rejects users who are not members of the store", async () => {
    const { authService, authorizationService } =
      createMemoryAuthorizationService();
    const { tokens } = await registerStaffUser(authService);

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "catalogue:read",
      ),
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.STORE_ACCESS_DENIED,
      status: 403,
    });
  });

  it("rejects members accessing the wrong store", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "owner",
    });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_B_ID,
        }),
        TEST_STORE_B_ID,
        "catalogue:read",
      ),
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.STORE_ACCESS_DENIED,
      status: 403,
    });
  });

  it("rejects staff attempting write operations", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "staff",
    });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "catalogue:write",
      ),
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.INSUFFICIENT_PERMISSION,
      status: 403,
    });
  });

  it("allows staff to read catalogue and create orders", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "staff",
    });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "catalogue:read",
      ),
    ).resolves.toMatchObject({ storeRole: "staff" });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "orders:write",
      ),
    ).resolves.toMatchObject({ storeRole: "staff" });
  });

  it("allows owners and admins to perform fulfillment actions", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();

    for (const role of ["owner", "admin"] as const) {
      const { user, tokens } = await registerStaffUser(authService);

      storeMemberRepository.seedMember({
        storeId: TEST_STORE_A_ID,
        userId: user.id,
        role,
      });

      await expect(
        authorizationService.authorizeStoreRequest(
          createAuthorizedRequest({
            accessToken: tokens.accessToken,
            storeId: TEST_STORE_A_ID,
          }),
          TEST_STORE_A_ID,
          "orders:fulfill",
        ),
      ).resolves.toMatchObject({ storeRole: role });
    }
  });

  it("allows staff to read store settings but not update them", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "staff",
    });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "stores:read",
      ),
    ).resolves.toMatchObject({ storeRole: "staff" });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "stores:write",
      ),
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.INSUFFICIENT_PERMISSION,
      status: 403,
    });
  });

  it("allows managers to update store settings", async () => {
    const { authService, authorizationService, storeMemberRepository } =
      createMemoryAuthorizationService();
    const { user, tokens } = await registerStaffUser(authService);

    storeMemberRepository.seedMember({
      storeId: TEST_STORE_A_ID,
      userId: user.id,
      role: "manager",
    });

    await expect(
      authorizationService.authorizeStoreRequest(
        createAuthorizedRequest({
          accessToken: tokens.accessToken,
          storeId: TEST_STORE_A_ID,
        }),
        TEST_STORE_A_ID,
        "stores:write",
      ),
    ).resolves.toMatchObject({ storeRole: "manager" });
  });
});
