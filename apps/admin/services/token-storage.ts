const ACCESS_TOKEN_KEY = "commerceflow.admin.accessToken";
const REFRESH_TOKEN_KEY = "commerceflow.admin.refreshToken";

export interface StoredTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function getStoredTokens(): StoredTokens | null {
  if (!canUseStorage()) {
    return null;
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

export function setStoredTokens(tokens: StoredTokens): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredTokens(): void {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getStoredAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}
