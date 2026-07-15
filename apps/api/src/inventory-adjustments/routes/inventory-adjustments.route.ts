import {
  createInventoryAdjustmentSchema,
  inventoryAdjustmentIdQuerySchema,
  listInventoryAdjustmentsQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import {
  INVENTORY_ADJUSTMENT_ERROR_CODES,
  InventoryAdjustmentError,
} from "../errors";
import { inventoryAdjustmentService } from "../services";
import {
  handleInventoryAdjustmentRouteError,
  jsonSuccess,
} from "./http-response";
import { getQueryParams } from "./request-utils";

function adjustmentAuditMetadata(adjustment: {
  id: string;
  inventoryItemId: string;
  adjustmentNumber: string;
  movementQuantity: number;
  reason: string;
}) {
  return {
    inventoryItemId: adjustment.inventoryItemId,
    adjustmentNumber: adjustment.adjustmentNumber,
    movementQuantity: adjustment.movementQuantity,
    reason: adjustment.reason,
  };
}

export async function handleCreateInventoryAdjustment(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createInventoryAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      throw new InventoryAdjustmentError(
        INVENTORY_ADJUSTMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const result = await inventoryAdjustmentService.createAdjustment(
      parsed.data,
      authContext.userId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_adjustment",
      entityId: result.adjustment.id,
      action: "create",
      metadata: adjustmentAuditMetadata(result.adjustment),
    });

    auditService.recordFromAuthContext(authContext, {
      entityType: "stock_movement",
      entityId: result.stockMovement.id,
      action: "create",
      metadata: {
        inventoryItemId: result.stockMovement.inventoryItemId,
        movementType: result.stockMovement.movementType,
        quantity: result.stockMovement.quantity,
        inventoryAdjustmentId: result.adjustment.id,
      },
    });

    return jsonSuccess({ result }, 201);
  } catch (error) {
    return handleInventoryAdjustmentRouteError(error);
  }
}

export async function handleGetInventoryAdjustment(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = inventoryAdjustmentIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new InventoryAdjustmentError(
        INVENTORY_ADJUSTMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const adjustment = await inventoryAdjustmentService.getAdjustment(
      parsed.data,
      id,
    );

    return jsonSuccess({ adjustment });
  } catch (error) {
    return handleInventoryAdjustmentRouteError(error);
  }
}

export async function handleListInventoryAdjustments(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listInventoryAdjustmentsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new InventoryAdjustmentError(
        INVENTORY_ADJUSTMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const adjustments = await inventoryAdjustmentService.listAdjustments(
      parsed.data,
    );

    return jsonSuccess({ adjustments });
  } catch (error) {
    return handleInventoryAdjustmentRouteError(error);
  }
}
