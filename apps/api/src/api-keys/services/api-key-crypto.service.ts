import { randomBytes } from "node:crypto";

import {
  API_KEY_LOOKUP_PREFIX_LENGTH,
  API_KEY_PREFIX,
} from "@commerceflow/types";

import { hashPassword, verifyPassword } from "@/auth/services/password.service";

export interface GeneratedApiKeyMaterial {
  readonly secretKey: string;
  readonly keyPrefix: string;
  readonly hashedKey: string;
}

export function extractKeyPrefixFromSecret(secretKey: string): string | null {
  if (!secretKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const secretPart = secretKey.slice(API_KEY_PREFIX.length);

  if (secretPart.length < API_KEY_LOOKUP_PREFIX_LENGTH) {
    return null;
  }

  return `${API_KEY_PREFIX}${secretPart.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH)}`;
}

export async function generateApiKeyMaterial(): Promise<GeneratedApiKeyMaterial> {
  const secretPart = randomBytes(24).toString("base64url");
  const keyPrefix = `${API_KEY_PREFIX}${secretPart.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH)}`;
  const secretKey = `${API_KEY_PREFIX}${secretPart}`;
  const hashedKey = await hashPassword(secretKey);

  return {
    secretKey,
    keyPrefix,
    hashedKey,
  };
}

export async function verifyApiKeySecret(
  secretKey: string,
  hashedKey: string,
): Promise<boolean> {
  return verifyPassword(secretKey, hashedKey);
}

export function isApiKeyToken(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}
