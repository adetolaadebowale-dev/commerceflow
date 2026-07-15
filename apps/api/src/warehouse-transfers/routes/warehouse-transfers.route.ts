import {
  createWarehouseTransferSchema,
  listWarehouseTransfersQuerySchema,
  warehouseTransferIdQuerySchema,
  warehouseTransferLifecycleSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { WAREHOUSE_TRANSFER_ERROR_CODES, WarehouseTransferError } from "../errors";
import { warehouseTransferService } from "../services";
import { handleWarehouseTransferRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function warehouseTransferAuditMetadata(warehouseTransfer: {
  id: string;
  transferNumber: string;
  status: string;
}) {
  return {
    transferNumber: warehouseTransfer.transferNumber,
    status: warehouseTransfer.status,
  };
}

export async function handleCreateWarehouseTransfer(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createWarehouseTransferSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:write",
    );

    const warehouseTransfer =
      await warehouseTransferService.createWarehouseTransfer(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: warehouseTransfer.id,
      action: "create",
      metadata: warehouseTransferAuditMetadata(warehouseTransfer),
    });

    return jsonSuccess({ warehouseTransfer }, 201);
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}

export async function handleGetWarehouseTransfer(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = warehouseTransferIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:read",
    );

    const warehouseTransfer = await warehouseTransferService.getWarehouseTransfer(
      parsed.data,
      id,
    );

    return jsonSuccess({ warehouseTransfer });
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}

export async function handleListWarehouseTransfers(
  request: Request,
): Promise<Response> {
  try {
    const parsed = listWarehouseTransfersQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:read",
    );

    const warehouseTransfers =
      await warehouseTransferService.listWarehouseTransfers(parsed.data);

    return jsonSuccess({ warehouseTransfers });
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}

export async function handleApproveWarehouseTransfer(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = warehouseTransferLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:lifecycle",
    );

    const warehouseTransfer = await warehouseTransferService.approveWarehouseTransfer(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: warehouseTransfer.id,
      action: "approve",
      metadata: warehouseTransferAuditMetadata(warehouseTransfer),
    });

    return jsonSuccess({ warehouseTransfer });
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}

export async function handleShipWarehouseTransfer(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = warehouseTransferLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:lifecycle",
    );

    const result = await warehouseTransferService.shipWarehouseTransfer(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: result.warehouseTransfer.id,
      action: "ship",
      metadata: {
        ...warehouseTransferAuditMetadata(result.warehouseTransfer),
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
          warehouseTransferId: result.warehouseTransfer.id,
        },
      });
    }

    return jsonSuccess({ result });
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}

export async function handleReceiveWarehouseTransfer(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = warehouseTransferLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:lifecycle",
    );

    const result = await warehouseTransferService.receiveWarehouseTransfer(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: result.warehouseTransfer.id,
      action: "receive",
      metadata: {
        ...warehouseTransferAuditMetadata(result.warehouseTransfer),
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
          warehouseTransferId: result.warehouseTransfer.id,
        },
      });
    }

    return jsonSuccess({ result });
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}

export async function handleCancelWarehouseTransfer(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = warehouseTransferLifecycleSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseTransferError(
        WAREHOUSE_TRANSFER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouse-transfers:lifecycle",
    );

    const warehouseTransfer = await warehouseTransferService.cancelWarehouseTransfer(
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse_transfer",
      entityId: warehouseTransfer.id,
      action: "cancel",
      metadata: warehouseTransferAuditMetadata(warehouseTransfer),
    });

    return jsonSuccess({ warehouseTransfer });
  } catch (error) {
    return handleWarehouseTransferRouteError(error);
  }
}
