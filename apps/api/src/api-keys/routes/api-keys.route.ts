import {
  apiKeyIdQuerySchema,
  createApiKeySchema,
  listApiKeysQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import { API_KEY_ERROR_CODES, ApiKeyError } from "../errors";
import { apiKeyService } from "../services";
import { handleApiKeyRouteError, jsonSuccess } from "./http-response";

function apiKeyAuditMetadata(apiKey: {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: readonly string[];
}) {
  return {
    apiKeyId: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    permissions: apiKey.permissions,
  };
}

export async function handleCreateApiKey(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createApiKeySchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    apiKeyService.assertAssignablePermissions(parsed.data.permissions);

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "api-keys:write",
    );

    const apiKey = await apiKeyService.createApiKey(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "api_key",
      entityId: apiKey.id,
      action: "create",
      metadata: apiKeyAuditMetadata(apiKey),
    });

    return jsonSuccess({ apiKey }, 201);
  } catch (error) {
    return handleApiKeyRouteError(error);
  }
}

export async function handleListApiKeys(request: Request): Promise<Response> {
  try {
    const parsed = listApiKeysQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "api-keys:read",
    );

    const result = await apiKeyService.listApiKeys(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleApiKeyRouteError(error);
  }
}

export async function handleGetApiKey(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = apiKeyIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "api-keys:read",
    );

    const apiKey = await apiKeyService.getApiKey(parsed.data.storeId, id);
    return jsonSuccess({ apiKey });
  } catch (error) {
    return handleApiKeyRouteError(error);
  }
}

export async function handleRevokeApiKey(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = apiKeyIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ApiKeyError(
        API_KEY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "api-keys:write",
    );

    const apiKey = await apiKeyService.revokeApiKey(parsed.data.storeId, id);

    auditService.recordFromAuthContext(authContext, {
      entityType: "api_key",
      entityId: apiKey.id,
      action: "revoke",
      metadata: apiKeyAuditMetadata(apiKey),
    });

    return jsonSuccess({ apiKey });
  } catch (error) {
    return handleApiKeyRouteError(error);
  }
}
