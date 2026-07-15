import {
  createShipmentSchema,
  listOrderShipmentsQuerySchema,
  orderShipmentActionSchema,
  shipmentIdQuerySchema,
} from "@commerceflow/validation";
import type { Shipment } from "@commerceflow/types";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { SHIPMENT_ERROR_CODES, ShipmentError } from "../errors";
import { shipmentService } from "../services";
import { handleShipmentRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateShipment(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = orderShipmentActionSchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createShipmentSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const shipment = await shipmentService.createShipment(
      queryParsed.data.storeId,
      orderId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment",
      entityId: shipment.id,
      action: "create",
      metadata: {
        orderId: shipment.orderId,
        shipmentNumber: shipment.shipmentNumber,
        carrier: shipment.carrier,
        status: shipment.status,
      },
    });

    return jsonSuccess({ shipment }, 201);
  } catch (error) {
    return handleShipmentRouteError(error);
  }
}

export async function handleListOrderShipments(
  orderId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = listOrderShipmentsQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const shipments = await shipmentService.listOrderShipments(
      parsed.data,
      orderId,
    );
    return jsonSuccess({ shipments });
  } catch (error) {
    return handleShipmentRouteError(error);
  }
}

export async function handleGetShipment(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shipmentIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const shipment = await shipmentService.getShipment(parsed.data.storeId, id);
    return jsonSuccess({ shipment });
  } catch (error) {
    return handleShipmentRouteError(error);
  }
}

export async function handlePackShipment(
  id: string,
  request: Request,
): Promise<Response> {
  return handleShipmentLifecycleAction(id, request, "pack", (query) =>
    shipmentService.packShipment(query, id),
  );
}

export async function handleShipShipment(
  id: string,
  request: Request,
): Promise<Response> {
  return handleShipmentLifecycleAction(id, request, "ship", (query) =>
    shipmentService.shipShipment(query, id),
  );
}

export async function handleDeliverShipment(
  id: string,
  request: Request,
): Promise<Response> {
  return handleShipmentLifecycleAction(id, request, "deliver", (query) =>
    shipmentService.deliverShipment(query, id),
  );
}

export async function handleCancelShipment(
  id: string,
  request: Request,
): Promise<Response> {
  return handleShipmentLifecycleAction(id, request, "cancel", (query) =>
    shipmentService.cancelShipment(query, id),
  );
}

async function handleShipmentLifecycleAction(
  id: string,
  request: Request,
  action: "pack" | "ship" | "deliver" | "cancel",
  execute: (query: { storeId: string }) => Promise<Shipment>,
): Promise<Response> {
  try {
    const parsed = shipmentIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new ShipmentError(
        SHIPMENT_ERROR_CODES.VALIDATION_ERROR,
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

    const shipment = await execute(parsed.data);

    if (action !== "pack") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "shipment",
        entityId: shipment.id,
        action,
        metadata: {
          orderId: shipment.orderId,
          shipmentNumber: shipment.shipmentNumber,
          carrier: shipment.carrier,
          status: shipment.status,
        },
      });
    }

    return jsonSuccess({ shipment });
  } catch (error) {
    return handleShipmentRouteError(error);
  }
}
