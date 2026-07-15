import {
  acceptReplenishmentRecommendationSchema,
  createReplenishmentRuleSchema,
  dismissReplenishmentRecommendationSchema,
  generateReplenishmentRecommendationsSchema,
  listReplenishmentRecommendationsQuerySchema,
  listReplenishmentRulesQuerySchema,
  replenishmentRecommendationIdQuerySchema,
  replenishmentRuleIdQuerySchema,
  updateReplenishmentRuleSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { REPLENISHMENT_ERROR_CODES, ReplenishmentError } from "../errors";
import { replenishmentService } from "../services";
import { handleReplenishmentRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function ruleAuditMetadata(rule: {
  warehouseId: string;
  productVariantId: string;
  supplierId: string;
  reorderPoint: number;
  isEnabled: boolean;
}) {
  return {
    warehouseId: rule.warehouseId,
    productVariantId: rule.productVariantId,
    supplierId: rule.supplierId,
    reorderPoint: rule.reorderPoint,
    isEnabled: rule.isEnabled,
  };
}

function recommendationAuditMetadata(recommendation: {
  warehouseId: string;
  productVariantId: string;
  supplierId: string;
  recommendedQuantity: number;
  status: string;
  purchaseOrderId?: string;
}) {
  return {
    warehouseId: recommendation.warehouseId,
    productVariantId: recommendation.productVariantId,
    supplierId: recommendation.supplierId,
    recommendedQuantity: recommendation.recommendedQuantity,
    status: recommendation.status,
    purchaseOrderId: recommendation.purchaseOrderId,
  };
}

export async function handleCreateReplenishmentRule(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createReplenishmentRuleSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:write",
    );

    const rule = await replenishmentService.createRule(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "replenishment_rule",
      entityId: rule.id,
      action: "create",
      metadata: ruleAuditMetadata(rule),
    });

    return jsonSuccess({ rule }, 201);
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleListReplenishmentRules(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listReplenishmentRulesQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:read",
    );

    const result = await replenishmentService.listRules(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleGetReplenishmentRule(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = replenishmentRuleIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:read",
    );

    const rule = await replenishmentService.getRule(parsed.data.storeId, id);
    return jsonSuccess({ rule });
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleUpdateReplenishmentRule(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = replenishmentRuleIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateReplenishmentRuleSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "replenishment:write",
    );

    const rule = await replenishmentService.updateRule(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "replenishment_rule",
      entityId: rule.id,
      action: "update",
      metadata: ruleAuditMetadata(rule),
    });

    return jsonSuccess({ rule });
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleDeleteReplenishmentRule(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = replenishmentRuleIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:write",
    );

    const rule = await replenishmentService.deleteRule(parsed.data.storeId, id);

    auditService.recordFromAuthContext(authContext, {
      entityType: "replenishment_rule",
      entityId: rule.id,
      action: "delete",
      metadata: ruleAuditMetadata(rule),
    });

    return jsonSuccess({ rule });
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleGenerateReplenishmentRecommendations(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = generateReplenishmentRecommendationsSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:write",
    );

    const recommendations =
      await replenishmentService.generateRecommendations(parsed.data);

    for (const recommendation of recommendations) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "replenishment_recommendation",
        entityId: recommendation.id,
        action: "generate",
        metadata: recommendationAuditMetadata(recommendation),
      });
    }

    return jsonSuccess({ recommendations }, 201);
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleListReplenishmentRecommendations(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listReplenishmentRecommendationsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:read",
    );

    const result = await replenishmentService.listRecommendations(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleGetReplenishmentRecommendation(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = replenishmentRecommendationIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:read",
    );

    const recommendation = await replenishmentService.getRecommendation(
      parsed.data.storeId,
      id,
    );
    return jsonSuccess({ recommendation });
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleAcceptReplenishmentRecommendation(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = acceptReplenishmentRecommendationSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:write",
    );

    const result = await replenishmentService.acceptRecommendation(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "replenishment_recommendation",
      entityId: result.recommendation.id,
      action: "accept",
      metadata: recommendationAuditMetadata(result.recommendation),
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}

export async function handleDismissReplenishmentRecommendation(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = dismissReplenishmentRecommendationSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReplenishmentError(
        REPLENISHMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "replenishment:write",
    );

    const recommendation = await replenishmentService.dismissRecommendation(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "replenishment_recommendation",
      entityId: recommendation.id,
      action: "dismiss",
      metadata: recommendationAuditMetadata(recommendation),
    });

    return jsonSuccess({ recommendation });
  } catch (error) {
    return handleReplenishmentRouteError(error);
  }
}
