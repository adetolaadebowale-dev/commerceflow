import {
  allocateInventorySchema,
  inventoryAllocationIdQuerySchema,
  reportShortageSchema,
  updateInventoryAllocationSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import {
  INVENTORY_ALLOCATION_ERROR_CODES,
  InventoryAllocationError,
} from "../errors";
import { inventoryAllocationService } from "../services";
import { handleInventoryAllocationRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function allocationAuditMetadata(allocation: {
  id: string;
  pickListItemId: string;
  inventoryItemId: string;
  status: string;
  quantityAllocated: number;
  quantityPicked: number;
}) {
  return {
    pickListItemId: allocation.pickListItemId,
    inventoryItemId: allocation.inventoryItemId,
    status: allocation.status,
    quantityAllocated: allocation.quantityAllocated,
    quantityPicked: allocation.quantityPicked,
  };
}

export async function handleAllocateInventory(
  pickListItemId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = inventoryAllocationIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = allocateInventorySchema.safeParse(body);

    if (!parsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "inventory:write",
    );

    const allocation = await inventoryAllocationService.allocateInventory(
      queryParsed.data.storeId,
      pickListItemId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_allocation",
      entityId: allocation.id,
      action: "allocate",
      metadata: allocationAuditMetadata(allocation),
    });

    return jsonSuccess({ allocation }, 201);
  } catch (error) {
    return handleInventoryAllocationRouteError(error);
  }
}

export async function handleGetAllocation(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = inventoryAllocationIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
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

    const allocation = await inventoryAllocationService.getAllocation(
      parsed.data.storeId,
      id,
    );

    return jsonSuccess({ allocation });
  } catch (error) {
    return handleInventoryAllocationRouteError(error);
  }
}

export async function handleUpdatePickedQuantity(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = inventoryAllocationIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateInventoryAllocationSchema.safeParse(body);

    if (!parsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "inventory:write",
    );

    const allocation = await inventoryAllocationService.updatePickedQuantity(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_allocation",
      entityId: allocation.id,
      action: "update",
      metadata: allocationAuditMetadata(allocation),
    });

    return jsonSuccess({ allocation });
  } catch (error) {
    return handleInventoryAllocationRouteError(error);
  }
}

export async function handleReportShortage(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = inventoryAllocationIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = reportShortageSchema.safeParse(body);

    if (!parsed.success) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "inventory:write",
    );

    const allocation = await inventoryAllocationService.reportShortage(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "inventory_allocation",
      entityId: allocation.id,
      action: "report_shortage",
      metadata: {
        ...allocationAuditMetadata(allocation),
        shortageReason: allocation.shortageReason,
      },
    });

    return jsonSuccess({ allocation });
  } catch (error) {
    return handleInventoryAllocationRouteError(error);
  }
}
