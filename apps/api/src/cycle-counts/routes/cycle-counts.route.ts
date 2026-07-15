import {
  approveCycleCountSchema,
  createCycleCountSchema,
  cycleCountIdQuerySchema,
  listCycleCountsQuerySchema,
  updateCycleCountSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { CYCLE_COUNT_ERROR_CODES, CycleCountError } from "../errors";
import { cycleCountService } from "../services";
import { handleCycleCountRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function cycleCountAuditMetadata(cycleCount: {
  id: string;
  cycleCountNumber: string;
  status: string;
}) {
  return {
    cycleCountNumber: cycleCount.cycleCountNumber,
    status: cycleCount.status,
  };
}

export async function handleCreateCycleCount(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createCycleCountSchema.safeParse(body);

    if (!parsed.success) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const cycleCount = await cycleCountService.createCycleCount(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "cycle_count",
      entityId: cycleCount.id,
      action: "create",
      metadata: cycleCountAuditMetadata(cycleCount),
    });

    return jsonSuccess({ cycleCount }, 201);
  } catch (error) {
    return handleCycleCountRouteError(error);
  }
}

export async function handleGetCycleCount(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = cycleCountIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:read",
    );

    const cycleCount = await cycleCountService.getCycleCount(parsed.data, id);

    return jsonSuccess({ cycleCount });
  } catch (error) {
    return handleCycleCountRouteError(error);
  }
}

export async function handleListCycleCounts(request: Request): Promise<Response> {
  try {
    const parsed = listCycleCountsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:read",
    );

    const cycleCounts = await cycleCountService.listCycleCounts(parsed.data);

    return jsonSuccess({ cycleCounts });
  } catch (error) {
    return handleCycleCountRouteError(error);
  }
}

export async function handleStartCycleCount(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = approveCycleCountSchema.safeParse(body);

    if (!parsed.success) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const cycleCount = await cycleCountService.startCycleCount(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "cycle_count",
      entityId: cycleCount.id,
      action: "start",
      metadata: cycleCountAuditMetadata(cycleCount),
    });

    return jsonSuccess({ cycleCount });
  } catch (error) {
    return handleCycleCountRouteError(error);
  }
}

export async function handleCompleteCycleCount(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateCycleCountSchema.safeParse(body);

    if (!parsed.success) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const cycleCount = await cycleCountService.completeCycleCount(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "cycle_count",
      entityId: cycleCount.id,
      action: "complete",
      metadata: cycleCountAuditMetadata(cycleCount),
    });

    return jsonSuccess({ cycleCount });
  } catch (error) {
    return handleCycleCountRouteError(error);
  }
}

export async function handleApproveCycleCount(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = approveCycleCountSchema.safeParse(body);

    if (!parsed.success) {
      throw new CycleCountError(
        CYCLE_COUNT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const result = await cycleCountService.approveCycleCount(
      id,
      parsed.data,
      authContext.userId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "cycle_count",
      entityId: result.cycleCount.id,
      action: "approve",
      metadata: {
        ...cycleCountAuditMetadata(result.cycleCount),
        adjustmentCount: result.adjustments.length,
        stockMovementCount: result.stockMovements.length,
      },
    });

    for (const adjustment of result.adjustments) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "inventory_adjustment",
        entityId: adjustment.id,
        action: "create",
        metadata: {
          inventoryItemId: adjustment.inventoryItemId,
          adjustmentNumber: adjustment.adjustmentNumber,
          movementQuantity: adjustment.movementQuantity,
          reason: adjustment.reason,
          cycleCountId: result.cycleCount.id,
        },
      });
    }

    for (const stockMovement of result.stockMovements) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "stock_movement",
        entityId: stockMovement.id,
        action: "create",
        metadata: {
          inventoryItemId: stockMovement.inventoryItemId,
          movementType: stockMovement.movementType,
          quantity: stockMovement.quantity,
          cycleCountId: result.cycleCount.id,
        },
      });
    }

    return jsonSuccess({ result });
  } catch (error) {
    return handleCycleCountRouteError(error);
  }
}
