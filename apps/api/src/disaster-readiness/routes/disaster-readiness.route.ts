import {
  disasterReadinessStoreQuerySchema,
  updateRecoveryObjectivesSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import {
  DISASTER_READINESS_ERROR_CODES,
  DisasterReadinessError,
} from "../errors";
import { disasterReadinessFacade } from "../services";
import {
  handleDisasterReadinessRouteError,
  jsonSuccess,
} from "./http-response";

async function authorizePlatformRead(request: Request) {
  const parsed = disasterReadinessStoreQuerySchema.safeParse(
    getQueryParams(request),
  );

  if (!parsed.success) {
    throw new DisasterReadinessError(
      DISASTER_READINESS_ERROR_CODES.VALIDATION_ERROR,
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

export async function handleGetPlatformBackups(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const backups = await disasterReadinessFacade.getBackups();
    return jsonSuccess({ backups });
  } catch (error) {
    return handleDisasterReadinessRouteError(error);
  }
}

export async function handleGetPlatformBackupVerification(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const verification = await disasterReadinessFacade.getBackupVerification();
    return jsonSuccess({ verification });
  } catch (error) {
    return handleDisasterReadinessRouteError(error);
  }
}

export async function handleGetPlatformRecovery(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const recovery = await disasterReadinessFacade.getRecoveryPlan();
    return jsonSuccess({ recovery });
  } catch (error) {
    return handleDisasterReadinessRouteError(error);
  }
}

export async function handleUpdatePlatformRecovery(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateRecoveryObjectivesSchema.safeParse(body);

    if (!parsed.success) {
      throw new DisasterReadinessError(
        DISASTER_READINESS_ERROR_CODES.VALIDATION_ERROR,
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

    const recoveryObjectives =
      await disasterReadinessFacade.updateRecoveryObjectives(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "recovery_objectives_update",
      metadata: {
        rpoMinutes: recoveryObjectives.rpoMinutes,
        rtoMinutes: recoveryObjectives.rtoMinutes,
        updatedAt: recoveryObjectives.updatedAt,
      },
    });

    return jsonSuccess({ recoveryObjectives });
  } catch (error) {
    return handleDisasterReadinessRouteError(error);
  }
}

export async function handleGetPlatformDisasterReadiness(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const disasterReadiness =
      await disasterReadinessFacade.getDisasterReadiness();
    return jsonSuccess({ disasterReadiness });
  } catch (error) {
    return handleDisasterReadinessRouteError(error);
  }
}
