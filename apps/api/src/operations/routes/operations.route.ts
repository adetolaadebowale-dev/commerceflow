import { operationsStoreQuerySchema } from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { OPERATIONS_ERROR_CODES, OperationsError } from "../errors";
import { operationalIntegrityService } from "../services";
import { handleOperationsRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function integrityAuditMetadata(result: {
  valid: boolean;
  issues: readonly unknown[];
}) {
  return {
    valid: result.valid,
    issueCount: result.issues.length,
  };
}

export async function handleGetWarehouseOperationalSummary(
  request: Request,
): Promise<Response> {
  try {
    const parsed = operationsStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:read",
    );

    const summary = await operationalIntegrityService.getWarehouseOperationalSummary(
      parsed.data,
    );

    return jsonSuccess(summary);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}

export async function handleGetFulfillmentDashboard(
  request: Request,
): Promise<Response> {
  try {
    const parsed = operationsStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:read",
    );

    const dashboard = await operationalIntegrityService.getFulfillmentDashboard(
      parsed.data,
    );

    return jsonSuccess(dashboard);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}

export async function handleGetProcurementDashboard(
  request: Request,
): Promise<Response> {
  try {
    const parsed = operationsStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:read",
    );

    const dashboard = await operationalIntegrityService.getProcurementDashboard(
      parsed.data,
    );

    return jsonSuccess(dashboard);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}

export async function handleGetInventoryHealthSummary(
  request: Request,
): Promise<Response> {
  try {
    const parsed = operationsStoreQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:read",
    );

    const summary = await operationalIntegrityService.getInventoryHealthSummary(
      parsed.data,
    );

    return jsonSuccess(summary);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}

export async function handleRunIntegrityCheck(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = operationsStoreQuerySchema.safeParse(body);

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:run",
    );

    const result = await operationalIntegrityService.runIntegrityCheck(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "operations",
      entityId: parsed.data.storeId,
      action: "integrity_check",
      metadata: integrityAuditMetadata(result),
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}

export async function handleRunWarehouseValidation(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = operationsStoreQuerySchema.safeParse(body);

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:run",
    );

    const result = await operationalIntegrityService.runWarehouseValidation(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "operations",
      entityId: parsed.data.storeId,
      action: "warehouse_validation",
      metadata: integrityAuditMetadata(result),
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}

export async function handleRunInventoryValidation(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = operationsStoreQuerySchema.safeParse(body);

    if (!parsed.success) {
      throw new OperationsError(
        OPERATIONS_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "operations:run",
    );

    const result = await operationalIntegrityService.runInventoryValidation(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "operations",
      entityId: parsed.data.storeId,
      action: "inventory_validation",
      metadata: integrityAuditMetadata(result),
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleOperationsRouteError(error);
  }
}
