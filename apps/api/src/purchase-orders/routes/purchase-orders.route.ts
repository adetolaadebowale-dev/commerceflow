import {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  purchaseOrderIdQuerySchema,
  purchaseOrderLifecycleSchema,
  receivePurchaseOrderSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { PURCHASE_ORDER_ERROR_CODES, PurchaseOrderError } from "../errors";
import { purchaseOrderService } from "../services";
import { handlePurchaseOrderRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function purchaseOrderAuditMetadata(purchaseOrder: {
  id: string;
  purchaseOrderNumber: string;
  status: string;
}) {
  return {
    purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
    status: purchaseOrder.status,
  };
}

export async function handleCreatePurchaseOrder(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createPurchaseOrderSchema.safeParse(body);

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:write",
    );

    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      action: "create",
      metadata: purchaseOrderAuditMetadata(purchaseOrder),
    });

    return jsonSuccess({ purchaseOrder }, 201);
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}

export async function handleGetPurchaseOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = purchaseOrderIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:read",
    );

    const purchaseOrder = await purchaseOrderService.getPurchaseOrder(
      parsed.data,
      id,
    );

    return jsonSuccess({ purchaseOrder });
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}

export async function handleListPurchaseOrders(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listPurchaseOrdersQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:read",
    );

    const purchaseOrders = await purchaseOrderService.listPurchaseOrders(parsed.data);

    return jsonSuccess({ purchaseOrders });
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}

export async function handleApprovePurchaseOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = purchaseOrderLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:lifecycle",
    );

    const purchaseOrder = await purchaseOrderService.approvePurchaseOrder(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      action: "approve",
      metadata: purchaseOrderAuditMetadata(purchaseOrder),
    });

    return jsonSuccess({ purchaseOrder });
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}

export async function handleOrderPurchaseOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = purchaseOrderLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:lifecycle",
    );

    const purchaseOrder = await purchaseOrderService.orderPurchaseOrder(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      action: "order",
      metadata: purchaseOrderAuditMetadata(purchaseOrder),
    });

    return jsonSuccess({ purchaseOrder });
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}

export async function handleReceivePurchaseOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = receivePurchaseOrderSchema.safeParse(body);

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:lifecycle",
    );

    const result = await purchaseOrderService.receivePurchaseOrder(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: result.purchaseOrder.id,
      action: "receive",
      metadata: {
        ...purchaseOrderAuditMetadata(result.purchaseOrder),
        stockMovementCount: result.stockMovements.length,
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
          purchaseOrderId: result.purchaseOrder.id,
        },
      });
    }

    return jsonSuccess({ result });
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}

export async function handleCancelPurchaseOrder(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = purchaseOrderLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "purchase-orders:lifecycle",
    );

    const purchaseOrder = await purchaseOrderService.cancelPurchaseOrder(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "purchase_order",
      entityId: purchaseOrder.id,
      action: "cancel",
      metadata: purchaseOrderAuditMetadata(purchaseOrder),
    });

    return jsonSuccess({ purchaseOrder });
  } catch (error) {
    return handlePurchaseOrderRouteError(error);
  }
}
