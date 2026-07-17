import {
  loadTestingStoreQuerySchema,
  updateLoadTestingConfigurationSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import { LOAD_TESTING_ERROR_CODES, LoadTestingError } from "../errors";
import { loadTestingService } from "../services";
import { handleLoadTestingRouteError, jsonSuccess } from "./http-response";

async function authorizePlatformRead(request: Request) {
  const parsed = loadTestingStoreQuerySchema.safeParse(
    getQueryParams(request),
  );

  if (!parsed.success) {
    throw new LoadTestingError(
      LOAD_TESTING_ERROR_CODES.VALIDATION_ERROR,
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

export async function handleGetPlatformLoadTesting(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const loadTesting = await loadTestingService.getSummary();
    return jsonSuccess({ loadTesting });
  } catch (error) {
    return handleLoadTestingRouteError(error);
  }
}

export async function handleUpdatePlatformLoadTesting(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateLoadTestingConfigurationSchema.safeParse(body);

    if (!parsed.success) {
      throw new LoadTestingError(
        LOAD_TESTING_ERROR_CODES.VALIDATION_ERROR,
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

    const configuration = await loadTestingService.updateConfiguration(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "load_testing_configuration_update",
      metadata: {
        enabled: configuration.enabled,
        preferredTool: configuration.preferredTool,
        targetVirtualUsers: configuration.targetVirtualUsers,
        durationSeconds: configuration.durationSeconds,
        rampUpSeconds: configuration.rampUpSeconds,
        updatedAt: configuration.updatedAt,
      },
    });

    return jsonSuccess({ configuration });
  } catch (error) {
    return handleLoadTestingRouteError(error);
  }
}

export async function handleGetPlatformLoadTestingBaselines(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const baselines = loadTestingService.getBaselines();
    return jsonSuccess({ baselines });
  } catch (error) {
    return handleLoadTestingRouteError(error);
  }
}

export async function handleGetPlatformScalability(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const scalability = await loadTestingService.getAssessment();
    return jsonSuccess({ scalability });
  } catch (error) {
    return handleLoadTestingRouteError(error);
  }
}
