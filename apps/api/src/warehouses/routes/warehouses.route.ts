import {
  createWarehouseSchema,
  listWarehousesQuerySchema,
  updateWarehouseSchema,
  warehouseIdQuerySchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { WAREHOUSE_ERROR_CODES, WarehouseError } from "../errors";
import { warehouseService } from "../services";
import { handleWarehouseRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function warehouseAuditMetadata(warehouse: {
  name: string;
  code: string;
  status: string;
  isDefault: boolean;
}) {
  return {
    name: warehouse.name,
    code: warehouse.code,
    status: warehouse.status,
    isDefault: warehouse.isDefault,
  };
}

export async function handleCreateWarehouse(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createWarehouseSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouses:write",
    );

    const warehouse = await warehouseService.createWarehouse(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse",
      entityId: warehouse.id,
      action: "create",
      metadata: warehouseAuditMetadata(warehouse),
    });

    if (warehouse.status === "active") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "warehouse",
        entityId: warehouse.id,
        action: "activate",
        metadata: warehouseAuditMetadata(warehouse),
      });
    }

    return jsonSuccess({ warehouse }, 201);
  } catch (error) {
    return handleWarehouseRouteError(error);
  }
}

export async function handleListWarehouses(request: Request): Promise<Response> {
  try {
    const parsed = listWarehousesQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouses:read",
    );

    const result = await warehouseService.listWarehouses(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleWarehouseRouteError(error);
  }
}

export async function handleGetWarehouse(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = warehouseIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouses:read",
    );

    const warehouse = await warehouseService.getWarehouse(
      parsed.data.storeId,
      id,
    );
    return jsonSuccess({ warehouse });
  } catch (error) {
    return handleWarehouseRouteError(error);
  }
}

export async function handleUpdateWarehouse(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = warehouseIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateWarehouseSchema.safeParse(body);

    if (!parsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "warehouses:write",
    );

    const existing = await warehouseService.getWarehouse(
      queryParsed.data.storeId,
      id,
    );
    const warehouse = await warehouseService.updateWarehouse(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse",
      entityId: warehouse.id,
      action: "update",
      metadata: warehouseAuditMetadata(warehouse),
    });

    if (existing.status !== warehouse.status) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "warehouse",
        entityId: warehouse.id,
        action: warehouse.status === "active" ? "activate" : "deactivate",
        metadata: warehouseAuditMetadata(warehouse),
      });
    }

    return jsonSuccess({ warehouse });
  } catch (error) {
    return handleWarehouseRouteError(error);
  }
}

export async function handleDeleteWarehouse(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = warehouseIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouses:write",
    );

    const existing = await warehouseService.getWarehouse(
      parsed.data.storeId,
      id,
    );
    const warehouse = await warehouseService.softDeleteWarehouse(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse",
      entityId: warehouse.id,
      action: "delete",
      metadata: warehouseAuditMetadata(warehouse),
    });

    if (existing.status === "active") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "warehouse",
        entityId: warehouse.id,
        action: "deactivate",
        metadata: warehouseAuditMetadata(warehouse),
      });
    }

    return jsonSuccess({ warehouse });
  } catch (error) {
    return handleWarehouseRouteError(error);
  }
}

export async function handleActivateWarehouse(
  id: string,
  request: Request,
): Promise<Response> {
  return handleWarehouseLifecycleAction(id, request, "activate", (storeId) =>
    warehouseService.activateWarehouse(storeId, id),
  );
}

export async function handleDeactivateWarehouse(
  id: string,
  request: Request,
): Promise<Response> {
  return handleWarehouseLifecycleAction(id, request, "deactivate", (storeId) =>
    warehouseService.deactivateWarehouse(storeId, id),
  );
}

async function handleWarehouseLifecycleAction(
  id: string,
  request: Request,
  action: "activate" | "deactivate",
  execute: (storeId: string) => Promise<{
    id: string;
    name: string;
    code: string;
    status: string;
    isDefault: boolean;
  }>,
): Promise<Response> {
  try {
    const parsed = warehouseIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new WarehouseError(
        WAREHOUSE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "warehouses:write",
    );

    const warehouse = await execute(parsed.data.storeId);

    auditService.recordFromAuthContext(authContext, {
      entityType: "warehouse",
      entityId: warehouse.id,
      action,
      metadata: warehouseAuditMetadata(warehouse),
    });

    return jsonSuccess({ warehouse });
  } catch (error) {
    return handleWarehouseRouteError(error);
  }
}
