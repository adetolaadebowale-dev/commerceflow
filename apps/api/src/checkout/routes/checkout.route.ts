import {
  checkoutCartQuerySchema,
  checkoutCartSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { CHECKOUT_ERROR_CODES, CheckoutError } from "../errors";
import { checkoutService } from "../services";
import { handleCheckoutRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCheckoutCart(
  cartId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = checkoutCartQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = checkoutCartSchema.safeParse(body);

    if (!parsed.success) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "carts:write",
    );

    const result = await checkoutService.checkoutCart(
      queryParsed.data.storeId,
      cartId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "checkout",
      entityId: result.order.id,
      action: "checkout",
      metadata: {
        cartId: result.cart.id,
        orderId: result.order.id,
        customerProfileId: result.order.customerProfileId,
        customerAddressId: parsed.data.customerAddressId,
        itemCount: result.order.items.length,
        subtotal: result.order.subtotal,
        discountAmount: result.order.discountAmount,
        taxAmount: result.order.taxAmount,
        total: result.order.total,
        currency: result.order.currency,
      },
    });

    return jsonSuccess(result, 201);
  } catch (error) {
    return handleCheckoutRouteError(error);
  }
}
