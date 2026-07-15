import {
  createShipmentPackageSchema,
  shipmentPackageIdQuerySchema,
  shipmentPackageQuerySchema,
  updateShipmentPackageSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { SHIPMENT_PACKAGE_ERROR_CODES, ShipmentPackageError } from "../errors";
import { shipmentPackageService } from "../services";
import { handleShipmentPackageRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function packageAuditMetadata(shipmentPackage: {
  id: string;
  shipmentId: string;
  packageNumber: string;
  weight: string;
  weightUnit: string;
}) {
  return {
    shipmentId: shipmentPackage.shipmentId,
    packageNumber: shipmentPackage.packageNumber,
    weight: shipmentPackage.weight,
    weightUnit: shipmentPackage.weightUnit,
  };
}

export async function handleCreatePackage(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = shipmentPackageQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json().catch(() => ({}));
    const parsed = createShipmentPackageSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
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

    const shipmentPackage = await shipmentPackageService.createPackage(
      queryParsed.data.storeId,
      shipmentId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_package",
      entityId: shipmentPackage.id,
      action: "create",
      metadata: packageAuditMetadata(shipmentPackage),
    });

    return jsonSuccess({ shipmentPackage }, 201);
  } catch (error) {
    return handleShipmentPackageRouteError(error);
  }
}

export async function handleListPackages(
  shipmentId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shipmentPackageQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
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

    const packages = await shipmentPackageService.listPackages(
      parsed.data,
      shipmentId,
    );

    return jsonSuccess({ packages });
  } catch (error) {
    return handleShipmentPackageRouteError(error);
  }
}

export async function handleGetPackage(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shipmentPackageIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
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

    const shipmentPackage = await shipmentPackageService.getPackage(
      parsed.data.storeId,
      id,
    );

    return jsonSuccess({ shipmentPackage });
  } catch (error) {
    return handleShipmentPackageRouteError(error);
  }
}

export async function handleUpdatePackage(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = shipmentPackageIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!queryParsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateShipmentPackageSchema.safeParse(body);

    if (!parsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
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

    const shipmentPackage = await shipmentPackageService.updatePackage(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_package",
      entityId: shipmentPackage.id,
      action: "update",
      metadata: packageAuditMetadata(shipmentPackage),
    });

    return jsonSuccess({ shipmentPackage });
  } catch (error) {
    return handleShipmentPackageRouteError(error);
  }
}

export async function handleDeletePackage(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = shipmentPackageIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new ShipmentPackageError(
        SHIPMENT_PACKAGE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "shipments:write",
    );

    const shipmentPackage = await shipmentPackageService.deletePackage(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "shipment_package",
      entityId: shipmentPackage.id,
      action: "delete",
      metadata: packageAuditMetadata(shipmentPackage),
    });

    return jsonSuccess({ shipmentPackage });
  } catch (error) {
    return handleShipmentPackageRouteError(error);
  }
}
