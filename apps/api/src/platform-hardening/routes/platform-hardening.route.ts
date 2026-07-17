import {
  platformHardeningStoreQuerySchema,
  updateCachePolicySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import {
  PLATFORM_HARDENING_ERROR_CODES,
  PlatformHardeningError,
} from "../errors";
import { platformHardeningFacade } from "../services";
import {
  handlePlatformHardeningRouteError,
  jsonSuccess,
} from "./http-response";

async function authorizePlatformRead(request: Request): Promise<string> {
  const parsed = platformHardeningStoreQuerySchema.safeParse(
    getQueryParams(request),
  );

  if (!parsed.success) {
    throw new PlatformHardeningError(
      PLATFORM_HARDENING_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      parsed.error.flatten(),
    );
  }

  await authorizationService.authorizeStoreRequest(
    request,
    parsed.data.storeId,
    "platform:read",
  );

  return parsed.data.storeId;
}

export async function handleGetPlatformSecurity(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const security = platformHardeningFacade.getSecurityDiagnostics();
    return jsonSuccess({ security });
  } catch (error) {
    return handlePlatformHardeningRouteError(error);
  }
}

export async function handleGetPlatformPerformance(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const performance = platformHardeningFacade.getPerformanceDiagnostics();
    return jsonSuccess({ performance });
  } catch (error) {
    return handlePlatformHardeningRouteError(error);
  }
}

export async function handleGetPlatformCachePolicies(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const cachePolicies = await platformHardeningFacade.listCachePolicies();
    return jsonSuccess({ cachePolicies });
  } catch (error) {
    return handlePlatformHardeningRouteError(error);
  }
}

export async function handleUpdatePlatformCachePolicies(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateCachePolicySchema.safeParse(body);

    if (!parsed.success) {
      throw new PlatformHardeningError(
        PLATFORM_HARDENING_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "platform:write",
    );

    const cachePolicy = await platformHardeningFacade.updateCachePolicy(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "cache_policy_update",
      metadata: {
        resource: cachePolicy.resource,
        enabled: cachePolicy.enabled,
        ttlSeconds: cachePolicy.ttlSeconds,
        description: cachePolicy.description,
      },
    });

    return jsonSuccess({ cachePolicy });
  } catch (error) {
    return handlePlatformHardeningRouteError(error);
  }
}

export async function handleGetPlatformRateLimits(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const rateLimits = platformHardeningFacade.getRateLimitSummary();
    return jsonSuccess({ rateLimits });
  } catch (error) {
    return handlePlatformHardeningRouteError(error);
  }
}
