import {
  effectiveFeatureFlagsQuerySchema,
  featureFlagKeySchema,
  listFeatureFlagsQuerySchema,
  upsertFeatureFlagSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import { FEATURE_FLAG_ERROR_CODES, FeatureFlagError } from "../errors";
import { featureFlagService } from "../services";
import { handleFeatureFlagRouteError, jsonSuccess } from "./http-response";

function featureFlagAuditMetadata(featureFlag: {
  id: string;
  key: string;
  scope: string;
  enabled: boolean;
  organizationId?: string;
  storeId?: string;
  description?: string;
}) {
  return {
    featureFlagId: featureFlag.id,
    key: featureFlag.key,
    scope: featureFlag.scope,
    enabled: featureFlag.enabled,
    organizationId: featureFlag.organizationId,
    storeId: featureFlag.storeId,
    description: featureFlag.description,
  };
}

export async function handleListFeatureFlags(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listFeatureFlagsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new FeatureFlagError(
        FEATURE_FLAG_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "feature-flags:read",
    );

    const result = await featureFlagService.listFeatureFlags(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleFeatureFlagRouteError(error);
  }
}

export async function handleGetEffectiveFeatureFlags(
  request: Request,
): Promise<Response> {
  try {
    const parsed = effectiveFeatureFlagsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new FeatureFlagError(
        FEATURE_FLAG_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "feature-flags:read",
    );

    const result = await featureFlagService.getEffectiveFeatureFlags(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleFeatureFlagRouteError(error);
  }
}

export async function handleUpsertFeatureFlag(
  key: string,
  request: Request,
): Promise<Response> {
  try {
    const parsedKey = featureFlagKeySchema.safeParse(key);

    if (!parsedKey.success) {
      throw new FeatureFlagError(
        FEATURE_FLAG_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsedKey.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsedBody = upsertFeatureFlagSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new FeatureFlagError(
        FEATURE_FLAG_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsedBody.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsedBody.data.storeId,
      "feature-flags:write",
    );

    const featureFlag = await featureFlagService.upsertFeatureFlag(
      parsedKey.data,
      parsedBody.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "feature_flag",
      entityId: featureFlag.id,
      action: "update",
      metadata: featureFlagAuditMetadata(featureFlag),
    });

    return jsonSuccess({ featureFlag });
  } catch (error) {
    return handleFeatureFlagRouteError(error);
  }
}
