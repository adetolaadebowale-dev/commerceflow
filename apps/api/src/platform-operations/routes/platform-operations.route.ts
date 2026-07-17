import {
  platformStoreQuerySchema,
  updateMaintenanceModeSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import {
  PLATFORM_OPERATIONS_ERROR_CODES,
  PlatformOperationsError,
} from "../errors";
import { platformOperationsService } from "../services";
import {
  handlePlatformOperationsRouteError,
  jsonSuccess,
} from "./http-response";

export async function handleGetPlatformLiveness(): Promise<Response> {
  try {
    const liveness = await platformOperationsService.getLiveness();
    return jsonSuccess({ liveness });
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}

export async function handleGetPlatformReadiness(): Promise<Response> {
  try {
    const readiness = await platformOperationsService.getReadiness();
    const status = readiness.ready ? 200 : 503;
    return jsonSuccess({ readiness }, status);
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}

export async function handleGetPlatformHealth(
  request: Request,
): Promise<Response> {
  try {
    const parsed = platformStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PlatformOperationsError(
        PLATFORM_OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
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

    const health = await platformOperationsService.getHealth();
    return jsonSuccess({ health });
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}

export async function handleGetPlatformVersion(
  request: Request,
): Promise<Response> {
  try {
    const parsed = platformStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PlatformOperationsError(
        PLATFORM_OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
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

    const version = platformOperationsService.getVersion();
    return jsonSuccess({ version });
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}

export async function handleGetPlatformDiagnostics(
  request: Request,
): Promise<Response> {
  try {
    const parsed = platformStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PlatformOperationsError(
        PLATFORM_OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
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

    const diagnostics = await platformOperationsService.getDiagnostics(
      parsed.data.storeId,
    );
    return jsonSuccess({ diagnostics });
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}

export async function handleGetPlatformJobsSummary(
  request: Request,
): Promise<Response> {
  try {
    const parsed = platformStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PlatformOperationsError(
        PLATFORM_OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
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

    const jobs = await platformOperationsService.getJobSummary(
      parsed.data.storeId,
    );
    return jsonSuccess({ jobs });
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}

export async function handleUpdatePlatformMaintenance(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateMaintenanceModeSchema.safeParse(body);

    if (!parsed.success) {
      throw new PlatformOperationsError(
        PLATFORM_OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
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

    const maintenance = await platformOperationsService.updateMaintenanceMode(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: maintenance.maintenanceMode
        ? "maintenance_enable"
        : "maintenance_disable",
      metadata: {
        maintenanceMode: maintenance.maintenanceMode,
        maintenanceMessage: maintenance.maintenanceMessage,
        updatedAt: maintenance.updatedAt,
      },
    });

    return jsonSuccess({ maintenance });
  } catch (error) {
    return handlePlatformOperationsRouteError(error);
  }
}
