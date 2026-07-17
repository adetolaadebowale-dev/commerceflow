import { observabilityStoreQuerySchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { getQueryParams } from "@/jobs/routes/request-utils";
import {
  OBSERVABILITY_ERROR_CODES,
  ObservabilityError,
} from "../errors";
import { observabilityFacade } from "../services";
import {
  handleObservabilityRouteError,
  jsonSuccess,
} from "./http-response";

async function authorizePlatformRead(request: Request) {
  const parsed = observabilityStoreQuerySchema.safeParse(
    getQueryParams(request),
  );

  if (!parsed.success) {
    throw new ObservabilityError(
      OBSERVABILITY_ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      parsed.error.flatten(),
    );
  }

  const authContext = await authorizationService.authorizeStoreRequest(
    request,
    parsed.data.storeId,
    "platform:read",
  );

  return { storeId: parsed.data.storeId, authContext };
}

export async function handleGetPlatformLogging(
  request: Request,
): Promise<Response> {
  try {
    await authorizePlatformRead(request);
    const logging = observabilityFacade.getLoggingSummary();
    return jsonSuccess({ logging });
  } catch (error) {
    return handleObservabilityRouteError(error);
  }
}

export async function handleGetPlatformLoggingDiagnostics(
  request: Request,
): Promise<Response> {
  try {
    const { authContext } = await authorizePlatformRead(request);
    const diagnostics = observabilityFacade.getDiagnostics();

    auditService.recordFromAuthContext(authContext, {
      entityType: "platform",
      entityId: "platform",
      action: "logging_diagnostics",
      metadata: {
        status: diagnostics.status,
        totalEntries: diagnostics.summary.totalEntries,
        activeCorrelationContexts: diagnostics.activeCorrelationContexts,
        requestLoggingEnabled: diagnostics.requestLoggingEnabled,
        lastCorrelationId: diagnostics.lastCorrelationId,
      },
    });

    return jsonSuccess({ diagnostics });
  } catch (error) {
    return handleObservabilityRouteError(error);
  }
}
