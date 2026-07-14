import { orderFulfillmentActionSchema } from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { auditService } from "@/audit/services";
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
