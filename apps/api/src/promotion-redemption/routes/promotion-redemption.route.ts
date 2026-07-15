import {
  applyCartPromotionSchema,
  cartPromotionActionSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import {
  PROMOTION_REDEMPTION_ERROR_CODES,
  PromotionRedemptionError,
} from "../errors";
import { promotionRedemptionService } from "../services";
import { handlePromotionRedemptionRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleApplyCartPromotion(
  cartId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = cartPromotionActionSchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = applyCartPromotionSchema.safeParse(body);

    if (!parsed.success) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.VALIDATION_ERROR,
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

    const cart = await promotionRedemptionService.applyPromotion(
      queryParsed.data.storeId,
      cartId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion_redemption",
      entityId: cart.appliedPromotion?.id ?? cartId,
      action: "apply",
      metadata: {
        cartId: cart.id,
        promotionId: cart.appliedPromotion?.promotionId,
        code: cart.appliedPromotion?.promotionCodeSnapshot,
        discountAmount: cart.discountAmount,
      },
    });

    return jsonSuccess({ cart });
  } catch (error) {
    return handlePromotionRedemptionRouteError(error);
  }
}

export async function handleRemoveCartPromotion(
  cartId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = cartPromotionActionSchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PromotionRedemptionError(
        PROMOTION_REDEMPTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "carts:write",
    );

    const cart = await promotionRedemptionService.removePromotion(
      parsed.data.storeId,
      cartId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion_redemption",
      entityId: cartId,
      action: "remove",
      metadata: {
        cartId: cart.id,
      },
    });

    return jsonSuccess({ cart });
  } catch (error) {
    return handlePromotionRedemptionRouteError(error);
  }
}
