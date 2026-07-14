import * as SecureStore from "expo-secure-store";

console.log("[startup][auth-storage.ts] module loaded");

const ACCESS_TOKEN_KEY = "commerceflow.mobile.accessToken";
const REFRESH_TOKEN_KEY = "commerceflow.mobile.refreshToken";

export interface StoredTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

let tokenCache: StoredTokens | null = null;

export async function hydrateTokenCache(): Promise<void> {
  console.log("[startup][auth-storage.ts] hydrateTokenCache start");
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    console.log("[startup][auth-storage.ts] hydrateTokenCache read complete", {
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
    });

    if (accessToken && refreshToken) {
      tokenCache = { accessToken, refreshToken };
      return;
    }

    tokenCache = null;
  } catch (error) {
    console.error("[startup][auth-storage.ts] hydrateTokenCache failed", error);
    throw error;
  }
}

export function getStoredTokens(): StoredTokens | null {
  return tokenCache;
}

export async function setStoredTokens(tokens: StoredTokens): Promise<void> {
  tokenCache = tokens;

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export async function clearStoredTokens(): Promise<void> {
  tokenCache = null;

  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export function getStoredAccessToken(): string | null {
  return tokenCache?.accessToken ?? null;
}

export async function getStoredRefreshToken(): Promise<string | null> {
  if (tokenCache?.refreshToken) {
    return tokenCache.refreshToken;
  }

  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
