import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

describe("auth-storage", () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
  });

  it("hydrates, stores, and clears tokens in SecureStore", async () => {
    const authStorage = await import("./auth-storage");

    await authStorage.hydrateTokenCache();
    expect(authStorage.getStoredTokens()).toBeNull();

    await authStorage.setStoredTokens({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });

    expect(authStorage.getStoredAccessToken()).toBe("access-1");
    expect(authStorage.getStoredTokens()).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    });

    await authStorage.clearStoredTokens();
    expect(authStorage.getStoredTokens()).toBeNull();
  });
});
