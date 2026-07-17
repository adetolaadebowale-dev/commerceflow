import {
  ASSIGNABLE_API_KEY_PERMISSIONS,
  STORE_PERMISSIONS,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const apiKeyNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(200, "Name must be at most 200 characters");

const assignablePermissionSchema = z.enum(ASSIGNABLE_API_KEY_PERMISSIONS);

const expiresAtSchema = z
  .string()
  .datetime({ message: "expiresAt must be a valid ISO datetime" })
  .optional();

export const createApiKeySchema = z.object({
  storeId: storeIdSchema,
  name: apiKeyNameSchema,
  permissions: z
    .array(assignablePermissionSchema)
    .min(1, "At least one permission is required"),
  expiresAt: expiresAtSchema,
});

export const listApiKeysQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const apiKeyIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const authenticateApiKeySchema = z.object({
  apiKey: z.string().trim().min(1, "API key is required"),
  storeId: storeIdSchema,
  permission: z.enum(STORE_PERMISSIONS),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type ListApiKeysQuery = z.infer<typeof listApiKeysQuerySchema>;
export type AuthenticateApiKeyInput = z.infer<typeof authenticateApiKeySchema>;
