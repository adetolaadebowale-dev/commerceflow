import {
  auditLogIdQuerySchema,
  listAuditLogsQuerySchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { AUDIT_ERROR_CODES, AuditError } from "../errors";
import { auditService } from "../services";
import { handleAuditRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleListAuditLogs(request: Request): Promise<Response> {
  try {
    const parsed = listAuditLogsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new AuditError(
        AUDIT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "audit:read",
    );

    const result = await auditService.listAuditLogs(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleAuditRouteError(error);
  }
}

export async function handleGetAuditLog(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = auditLogIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new AuditError(
        AUDIT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "audit:read",
    );

    const auditLog = await auditService.getAuditLog(parsed.data.storeId, id);
    return jsonSuccess({ auditLog });
  } catch (error) {
    return handleAuditRouteError(error);
  }
}
