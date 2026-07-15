import {
  createPickListSchema,
  pickListIdQuerySchema,
  pickListQuerySchema,
  updatePickListSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { PICK_LIST_ERROR_CODES, PickListError } from "../errors";
import { pickListService } from "../services";
import { handlePickListRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function pickListAuditMetadata(pickList: {
  id: string;
  shipmentId: string;
  status: string;
}) {
  return {
    shipmentId: pickList.shipmentId,
    status: pickList.status,
  };
}

export async function handleCreatePickList(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = pickListQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createPickListSchema.safeParse(body);

    if (!parsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "shipments:write",
    );

    const pickList = await pickListService.createPickList(
      queryParsed.data.storeId,
      shipmentId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: pickList.id,
      action: "create",
      metadata: pickListAuditMetadata(pickList),
    });

    return jsonSuccess({ pickList }, 201);
  } catch (error) {
    return handlePickListRouteError(error);
  }
}

export async function handleListShipmentPickLists(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = pickListQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:read",
    );

    const pickLists = await pickListService.listShipmentPickLists(
      parsed.data,
      shipmentId,
    );

    return jsonSuccess({ pickLists });
  } catch (error) {
    return handlePickListRouteError(error);
  }
}

export async function handleGetPickList(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = pickListIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:read",
    );

    const pickList = await pickListService.getPickList(parsed.data.storeId, id);

    return jsonSuccess({ pickList });
  } catch (error) {
    return handlePickListRouteError(error);
  }
}

export async function handleStartPicking(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = pickListIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:lifecycle",
    );

    const pickList = await pickListService.startPicking(parsed.data.storeId, id);

    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: pickList.id,
      action: "start",
      metadata: pickListAuditMetadata(pickList),
    });

    return jsonSuccess({ pickList });
  } catch (error) {
    return handlePickListRouteError(error);
  }
}

export async function handleCompletePicking(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = pickListIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const bodyParsed = updatePickListSchema.safeParse(body);
    const input = bodyParsed.success ? bodyParsed.data : undefined;

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:lifecycle",
    );

    const pickList = await pickListService.completePicking(
      parsed.data.storeId,
      id,
      input,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: pickList.id,
      action: "complete",
      metadata: pickListAuditMetadata(pickList),
    });

    return jsonSuccess({ pickList });
  } catch (error) {
    return handlePickListRouteError(error);
  }
}

export async function handleMarkPacked(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = pickListIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:lifecycle",
    );

    const pickList = await pickListService.markPacked(parsed.data.storeId, id);

    auditService.recordFromAuthContext(authContext, {
      entityType: "pick_list",
      entityId: pickList.id,
      action: "pack",
      metadata: pickListAuditMetadata(pickList),
    });

    return jsonSuccess({ pickList });
  } catch (error) {
    return handlePickListRouteError(error);
  }
}
