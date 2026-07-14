import { orderFulfillmentActionSchema } from "@commerceflow/validation";

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

    const result = await fulfillmentService.fulfillOrder(parsed.data, orderId);
    return jsonSuccess(result, 201);
  } catch (error) {
    return handleFulfillmentRouteError(error);
  }
}
