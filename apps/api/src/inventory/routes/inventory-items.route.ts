import {
  createInventoryItemSchema,
  inventoryItemIdQuerySchema,
  listInventoryItemsQuerySchema,
} from "@commerceflow/validation";

import { INVENTORY_ERROR_CODES, InventoryError } from "../errors";
import { inventoryService } from "../services";
import { handleInventoryRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateInventoryItem(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createInventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const result = await inventoryService.createInventoryItem(parsed.data);
    return jsonSuccess(result, 201);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}

export async function handleListInventoryItems(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listInventoryItemsQuerySchema.safeParse(
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

    const result = await inventoryService.listInventoryItems(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}

export async function handleGetInventoryItem(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = inventoryItemIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new InventoryError(
        INVENTORY_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const inventoryItem = await inventoryService.getInventoryItem(
      parsed.data.storeId,
      id,
    );
    return jsonSuccess({ inventoryItem });
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
