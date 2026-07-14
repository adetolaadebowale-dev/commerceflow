import {
  createStockMovementSchema,
  listStockMovementsQuerySchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { INVENTORY_ERROR_CODES, InventoryError } from "../errors";
import { inventoryService } from "../services";
import { handleInventoryRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateStockMovement(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createStockMovementSchema.safeParse(body);

    if (!parsed.success) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const result = await inventoryService.adjustStock(parsed.data);
    return jsonSuccess(result, 201);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}

export async function handleListStockMovements(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listStockMovementsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.VALIDATION_ERROR,
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

    const result = await inventoryService.listStockMovements(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
