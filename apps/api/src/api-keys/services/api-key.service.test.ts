import { describe, expect, it } from "vitest";

import { API_KEY_PREFIX } from "@commerceflow/types";

import { API_KEY_ERROR_CODES, ApiKeyError } from "../errors";
import {
  createMemoryApiKeyModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCreateApiKeyInput,
} from "../testing/api-key-test-utils";

describe("ApiKeyService", () => {
  it("creates an API key and returns the secret only once", async () => {
    const module = createMemoryApiKeyModule();

    const apiKey = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    expect(apiKey.secretKey).toMatch(new RegExp(`^${API_KEY_PREFIX}`));
    expect(apiKey.keyPrefix).toBe(
      apiKey.secretKey.slice(0, apiKey.keyPrefix.length),
    );

    const listed = await module.apiKeyService.listApiKeys({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });

    expect(listed.items[0]).not.toHaveProperty("secretKey");
    expect(listed.items[0]).not.toHaveProperty("hashedKey");
  });

  it("lists and retrieves API key details without secrets", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput({ name: "Read Key" }),
    );

    const apiKey = await module.apiKeyService.getApiKey(
      TEST_STORE_A_ID,
      created.id,
    );

    expect(apiKey).toMatchObject({
      id: created.id,
      name: "Read Key",
      keyPrefix: created.keyPrefix,
      permissions: ["catalogue:read", "orders:read"],
    });
    expect(apiKey).not.toHaveProperty("secretKey");
  });

  it("revokes an API key", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    const revoked = await module.apiKeyService.revokeApiKey(
      TEST_STORE_A_ID,
      created.id,
    );

    expect(revoked.revokedAt).toBeDefined();

    await expect(
      module.apiKeyService.revokeApiKey(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.ALREADY_REVOKED,
      status: 409,
    });
  });

  it("rejects api-keys permissions in assignable scopes", () => {
    const module = createMemoryApiKeyModule();

    expect(() =>
      module.apiKeyService.assertAssignablePermissions(["api-keys:write"]),
    ).toThrow(ApiKeyError);
  });

  it("returns not found for unknown keys", async () => {
    const module = createMemoryApiKeyModule();

    await expect(
      module.apiKeyService.getApiKey(
        TEST_STORE_A_ID,
        "99999999-9999-9999-9999-999999999999",
      ),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("isolates API keys by store", async () => {
    const module = createMemoryApiKeyModule();
    const storeBKey = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput({ storeId: TEST_STORE_B_ID }),
    );

    await expect(
      module.apiKeyService.getApiKey(TEST_STORE_A_ID, storeBKey.id),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});

describe("ApiKeyAuthenticationService", () => {
  it("authenticates valid API keys and records lastUsedAt", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    const context =
      await module.apiKeyAuthenticationService.authenticateToken(
        created.secretKey,
        TEST_STORE_A_ID,
        "catalogue:read",
      );

    expect(context).toMatchObject({
      apiKeyId: created.id,
      storeId: TEST_STORE_A_ID,
      permission: "catalogue:read",
    });

    const updated = await module.apiKeyService.getApiKey(
      TEST_STORE_A_ID,
      created.id,
    );

    expect(updated.lastUsedAt).toBeDefined();
  });

  it("rejects revoked API keys", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput(),
    );

    await module.apiKeyService.revokeApiKey(TEST_STORE_A_ID, created.id);

    await expect(
      module.apiKeyAuthenticationService.authenticateToken(
        created.secretKey,
        TEST_STORE_A_ID,
        "catalogue:read",
      ),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.REVOKED,
      status: 401,
    });
  });

  it("rejects expired API keys", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput({
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    );

    await expect(
      module.apiKeyAuthenticationService.authenticateToken(
        created.secretKey,
        TEST_STORE_A_ID,
        "catalogue:read",
      ),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.EXPIRED,
      status: 401,
    });
  });

  it("rejects keys without required permission", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput({ permissions: ["catalogue:read"] }),
    );

    await expect(
      module.apiKeyAuthenticationService.authenticateToken(
        created.secretKey,
        TEST_STORE_A_ID,
        "orders:write",
      ),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.INSUFFICIENT_PERMISSION,
      status: 403,
    });
  });

  it("rejects keys for the wrong store", async () => {
    const module = createMemoryApiKeyModule();
    const created = await module.apiKeyService.createApiKey(
      validCreateApiKeyInput({ storeId: TEST_STORE_B_ID }),
    );

    await expect(
      module.apiKeyAuthenticationService.authenticateToken(
        created.secretKey,
        TEST_STORE_A_ID,
        "catalogue:read",
      ),
    ).rejects.toMatchObject({
      code: API_KEY_ERROR_CODES.INVALID_KEY,
      status: 401,
    });
  });
});
