import {
  completeReturnSchema,
  createReturnSchema,
  inspectReturnSchema,
  listReturnsQuerySchema,
  receiveReturnSchema,
  returnIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { RETURN_ERROR_CODES, ReturnError } from "../errors";
import { returnService } from "../services";
import { handleReturnRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function returnAuditMetadata(returnRecord: {
  id: string;
  orderId: string;
  shipmentId: string;
  returnNumber: string;
  status: string;
}) {
  return {
    orderId: returnRecord.orderId,
    shipmentId: returnRecord.shipmentId,
    returnNumber: returnRecord.returnNumber,
    status: returnRecord.status,
  };
}

export async function handleCreateReturn(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createReturnSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReturnError(
        RETURN_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const returnRecord = await returnService.createReturn(orderId, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: returnRecord.id,
      action: "create",
      metadata: returnAuditMetadata(returnRecord),
    });

    return jsonSuccess({ return: returnRecord }, 201);
  } catch (error) {
    return handleReturnRouteError(error);
  }
}

export async function handleListOrderReturns(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listReturnsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ReturnError(
        RETURN_ERROR_CODES.VALIDATION_ERROR,
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

    const returns = await returnService.listReturns(orderId, parsed.data);

    return jsonSuccess({ returns });
  } catch (error) {
    return handleReturnRouteError(error);
  }
}

export async function handleGetReturn(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = returnIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ReturnError(
        RETURN_ERROR_CODES.VALIDATION_ERROR,
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

    const returnRecord = await returnService.getReturn(parsed.data, id);

    return jsonSuccess({ return: returnRecord });
  } catch (error) {
    return handleReturnRouteError(error);
  }
}

export async function handleReceiveReturn(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = receiveReturnSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReturnError(
        RETURN_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const returnRecord = await returnService.receiveReturn(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: returnRecord.id,
      action: "receive",
      metadata: returnAuditMetadata(returnRecord),
    });

    return jsonSuccess({ return: returnRecord });
  } catch (error) {
    return handleReturnRouteError(error);
  }
}

export async function handleInspectReturn(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = inspectReturnSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReturnError(
        RETURN_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const returnRecord = await returnService.inspectReturn(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: returnRecord.id,
      action: "inspect",
      metadata: returnAuditMetadata(returnRecord),
    });

    return jsonSuccess({ return: returnRecord });
  } catch (error) {
    return handleReturnRouteError(error);
  }
}

export async function handleCompleteReturn(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = completeReturnSchema.safeParse(body);

    if (!parsed.success) {
      throw new ReturnError(
        RETURN_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "inventory:write",
    );

    const result = await returnService.completeReturn(id, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "return",
      entityId: result.return.id,
      action: "complete",
      metadata: {
        ...returnAuditMetadata(result.return),
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
          returnId: result.return.id,
        },
      });
    }

    return jsonSuccess({ result });
  } catch (error) {
    return handleReturnRouteError(error);
  }
}
