import type { StorePermissionCode } from "../authorization/store-permission";

/** Permissions assignable to an API key (excludes key management). */
export const ASSIGNABLE_API_KEY_PERMISSIONS = [
  "catalogue:read",
  "catalogue:write",
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:write",
  "orders:lifecycle",
  "orders:fulfill",
  "reservations:manage",
  "audit:read",
  "customers:read",
  "customers:write",
  "carts:read",
  "carts:write",
  "payments:read",
  "payments:write",
  "payments:lifecycle",
  "invoices:read",
  "invoices:write",
  "invoices:lifecycle",
  "refunds:read",
  "refunds:write",
  "refunds:lifecycle",
  "promotions:read",
  "promotions:write",
  "tax-rates:read",
  "tax-rates:write",
  "shipments:read",
  "shipments:write",
  "shipments:lifecycle",
  "shipping-config:read",
  "shipping-config:write",
  "warehouses:read",
  "warehouses:write",
  "warehouse-transfers:read",
  "warehouse-transfers:write",
  "warehouse-transfers:lifecycle",
  "purchase-orders:read",
  "purchase-orders:write",
  "purchase-orders:lifecycle",
  "suppliers:read",
  "suppliers:write",
  "replenishment:read",
  "replenishment:write",
  "operations:read",
  "operations:run",
  "reports:read",
  "notifications:read",
  "notifications:write",
  "jobs:read",
  "jobs:write",
  "stores:read",
  "stores:write",
  "imports:read",
  "imports:write",
  "exports:read",
  "exports:write",
] as const satisfies readonly StorePermissionCode[];

export type AssignableApiKeyPermission =
  (typeof ASSIGNABLE_API_KEY_PERMISSIONS)[number];

/** Store-scoped API key metadata (never includes the secret). */
export interface ApiKey {
  readonly id: string;
  readonly storeId: string;
  readonly name: string;
  readonly keyPrefix: string;
  readonly permissions: readonly StorePermissionCode[];
  readonly lastUsedAt?: string;
  readonly expiresAt?: string;
  readonly revokedAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** API key returned once at creation with the plaintext secret. */
export interface ApiKeyWithSecret extends ApiKey {
  readonly secretKey: string;
}

/** Result of successful API key authentication. */
export interface AuthorizedApiKeyContext {
  readonly apiKeyId: string;
  readonly storeId: string;
  readonly permissions: readonly StorePermissionCode[];
  readonly permission: StorePermissionCode;
}

/** Prefix used for generated API keys. */
export const API_KEY_PREFIX = "cfk_live_";

/** Length of the lookup prefix stored on the key record. */
export const API_KEY_LOOKUP_PREFIX_LENGTH = 12;
