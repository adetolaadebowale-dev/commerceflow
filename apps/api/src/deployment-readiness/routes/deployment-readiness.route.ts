import {
  deploymentReadinessStoreQuerySchema,
  updateDeploymentConfigurationSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import {
  DEPLOYMENT_READINESS_ERROR_CODES,
  DeploymentReadinessError,
} from "../errors";
import { deploymentReadinessService } from "../services";
import {
  handleDeploymentReadinessRouteError,
  jsonSuccess,
} from "./http-response";

async function authorizePlatformRead(request: Request) {
  const parsed = deploymentReadinessStoreQuerySchema.safeParse(
    getQueryParams(request),
  );

  if (!parsed.success) {
    throw new DeploymentReadinessError(
      DEPLOYMENT_READINESS_ERROR_CODES.VALIDATION_ERROR,
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

export async function handleGetPlatformDeployment(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const deployment = await deploymentReadinessService.getReadiness();
    return jsonSuccess({ deployment });
  } catch (error) {
    return handleDeploymentReadinessRouteError(error);
  }
}

export async function handleUpdatePlatformDeployment(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateDeploymentConfigurationSchema.safeParse(body);

    if (!parsed.success) {
      throw new DeploymentReadinessError(
        DEPLOYMENT_READINESS_ERROR_CODES.VALIDATION_ERROR,
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

    const configuration = await deploymentReadinessService.updateConfiguration(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "deployment_configuration_update",
      metadata: {
        target: configuration.target,
        requireHttps: configuration.requireHttps,
        requireMigrationsApplied: configuration.requireMigrationsApplied,
        minimumNodeVersion: configuration.minimumNodeVersion,
        releaseChannel: configuration.releaseChannel,
        updatedAt: configuration.updatedAt,
      },
    });

    return jsonSuccess({ configuration });
  } catch (error) {
    return handleDeploymentReadinessRouteError(error);
  }
}

export async function handleGetPlatformDeploymentChecklist(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const checklist = await deploymentReadinessService.getChecklist();
    return jsonSuccess({ checklist });
  } catch (error) {
    return handleDeploymentReadinessRouteError(error);
  }
}

export async function handleGetPlatformEnvironment(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const environment =
      await deploymentReadinessService.getEnvironmentDiagnostics();
    return jsonSuccess({ environment });
  } catch (error) {
    return handleDeploymentReadinessRouteError(error);
  }
}

export async function handleGetPlatformRelease(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const release = await deploymentReadinessService.getReleaseMetadata();
    return jsonSuccess({ release });
  } catch (error) {
    return handleDeploymentReadinessRouteError(error);
  }
}
