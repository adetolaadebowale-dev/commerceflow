import {
  createPromotionSchema,
  listPromotionsQuerySchema,
  promotionIdQuerySchema,
  updatePromotionSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { PROMOTION_ERROR_CODES, PromotionError } from "../errors";
import { promotionService } from "../services";
import { handlePromotionRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function promotionAuditMetadata(promotion: {
  code: string;
  name: string;
  type: string;
  value: string;
  currency?: string;
  status: string;
}) {
  return {
    code: promotion.code,
    name: promotion.name,
    type: promotion.type,
    value: promotion.value,
    currency: promotion.currency,
    status: promotion.status,
  };
}

export async function handleCreatePromotion(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createPromotionSchema.safeParse(body);

    if (!parsed.success) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "promotions:write",
    );

    const promotion = await promotionService.createPromotion(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion",
      entityId: promotion.id,
      action: "create",
      metadata: promotionAuditMetadata(promotion),
    });

    return jsonSuccess({ promotion }, 201);
  } catch (error) {
    return handlePromotionRouteError(error);
  }
}

export async function handleListPromotions(request: Request): Promise<Response> {
  try {
    const parsed = listPromotionsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "promotions:read",
    );

    const result = await promotionService.listPromotions(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handlePromotionRouteError(error);
  }
}

export async function handleGetPromotion(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = promotionIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "promotions:read",
    );

    const promotion = await promotionService.getPromotion(
      parsed.data.storeId,
      id,
    );
    return jsonSuccess({ promotion });
  } catch (error) {
    return handlePromotionRouteError(error);
  }
}

export async function handleUpdatePromotion(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = promotionIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updatePromotionSchema.safeParse(body);

    if (!parsed.success) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "promotions:write",
    );

    const promotion = await promotionService.updatePromotion(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion",
      entityId: promotion.id,
      action: "update",
      metadata: promotionAuditMetadata(promotion),
    });

    return jsonSuccess({ promotion });
  } catch (error) {
    return handlePromotionRouteError(error);
  }
}

export async function handleDeletePromotion(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = promotionIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PromotionError(
        PROMOTION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "promotions:write",
    );

    const promotion = await promotionService.softDeletePromotion(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "promotion",
      entityId: promotion.id,
      action: "delete",
      metadata: promotionAuditMetadata(promotion),
    });

    return jsonSuccess({ promotion });
  } catch (error) {
    return handlePromotionRouteError(error);
  }
}
