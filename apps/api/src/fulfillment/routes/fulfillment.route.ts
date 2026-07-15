import {
  createFulfillmentSchema,
  listInventoryItemStockMovementsQuerySchema,
  orderFulfillmentActionSchema,
  stockMovementIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { FULFILLMENT_ERROR_CODES, FulfillmentError } from "../errors";
import { fulfillmentService } from "../services";
import { handleFulfillmentRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleFulfillOrder(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = orderFulfillmentActionSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new FulfillmentError(
        FULFILLMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "orders:fulfill",
    );

    const result = await fulfillmentService.fulfillOrder(parsed.data, orderId);
    auditService.recordFromAuthContext(authContext, {
      entityType: "order",
      entityId: result.order.id,
      action: "fulfill",
      metadata: {
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        stockMovementCount: result.stockMovements.length,
      },
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    return handleFulfillmentRouteError(error);
  }
}

export async function handleFulfillShipment(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = createFulfillmentSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new FulfillmentError(
        FULFILLMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:lifecycle",
    );

    const result = await fulfillmentService.fulfillShipment(
      parsed.data,
      shipmentId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment",
      entityId: result.shipment.id,
      action: "fulfill",
      metadata: {
        shipmentNumber: result.shipment.shipmentNumber,
        stockMovementCount: result.stockMovements.length,
        allocationCount: result.allocations.length,
      },
    });

    for (const stockMovement of result.stockMovements) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "stock_movement",
        entityId: stockMovement.id,
        action: "create",
        metadata: {
          inventoryItemId: stockMovement.inventoryItemId,
          movementType: stockMovement.movementType,
          quantity: stockMovement.quantity,
          shipmentId: stockMovement.shipmentId,
        },
      });
    }

    return jsonSuccess({ result }, 201);
  } catch (error) {
    return handleFulfillmentRouteError(error);
  }
}

export async function handleListInventoryItemStockMovements(
  inventoryItemId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listInventoryItemStockMovementsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new FulfillmentError(
        FULFILLMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const stockMovements = await fulfillmentService.listStockMovements(
      inventoryItemId,
      parsed.data,
    );

    return jsonSuccess(stockMovements);
  } catch (error) {
    return handleFulfillmentRouteError(error);
  }
}

export async function handleGetStockMovement(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = stockMovementIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new FulfillmentError(
        FULFILLMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const stockMovement = await fulfillmentService.getStockMovement(
      parsed.data,
      id,
    );

    return jsonSuccess({ stockMovement });
  } catch (error) {
    return handleFulfillmentRouteError(error);
  }
}
