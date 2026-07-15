import {
  createSupplierContactSchema,
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierContactIdQuerySchema,
  supplierIdQuerySchema,
  updateSupplierContactSchema,
  updateSupplierSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { SUPPLIER_ERROR_CODES, SupplierError } from "../errors";
import { supplierService } from "../services";
import { handleSupplierRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function supplierAuditMetadata(supplier: {
  code: string;
  name: string;
  status: string;
}) {
  return {
    code: supplier.code,
    name: supplier.name,
    status: supplier.status,
  };
}

function contactAuditMetadata(contact: {
  firstName: string;
  lastName: string;
  isPrimary: boolean;
}) {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    isPrimary: contact.isPrimary,
  };
}

export async function handleCreateSupplier(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createSupplierSchema.safeParse(body);

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:write",
    );

    const supplier = await supplierService.createSupplier(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier",
      entityId: supplier.id,
      action: "create",
      metadata: supplierAuditMetadata(supplier),
    });

    return jsonSuccess({ supplier }, 201);
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleListSuppliers(request: Request): Promise<Response> {
  try {
    const parsed = listSuppliersQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:read",
    );

    const result = await supplierService.listSuppliers(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleGetSupplier(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = supplierIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:read",
    );

    const supplier = await supplierService.getSupplier(parsed.data.storeId, id);
    return jsonSuccess({ supplier });
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleUpdateSupplier(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = supplierIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateSupplierSchema.safeParse(body);

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "suppliers:write",
    );

    const supplier = await supplierService.updateSupplier(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier",
      entityId: supplier.id,
      action: "update",
      metadata: supplierAuditMetadata(supplier),
    });

    return jsonSuccess({ supplier });
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleDeleteSupplier(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = supplierIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:write",
    );

    const supplier = await supplierService.softDeleteSupplier(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier",
      entityId: supplier.id,
      action: "delete",
      metadata: supplierAuditMetadata(supplier),
    });

    return jsonSuccess({ supplier });
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleCreateSupplierContact(
  supplierId: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createSupplierContactSchema.safeParse(body);

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:write",
    );

    const contact = await supplierService.createContact(supplierId, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier_contact",
      entityId: contact.id,
      action: "create",
      metadata: {
        supplierId,
        ...contactAuditMetadata(contact),
      },
    });

    return jsonSuccess({ contact }, 201);
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleUpdateSupplierContact(
  contactId: string,
  request: Request,
): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = updateSupplierContactSchema.safeParse(body);

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:write",
    );

    const contact = await supplierService.updateContact(contactId, parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier_contact",
      entityId: contact.id,
      action: "update",
      metadata: {
        supplierId: contact.supplierId,
        ...contactAuditMetadata(contact),
      },
    });

    return jsonSuccess({ contact });
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}

export async function handleDeleteSupplierContact(
  contactId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = supplierContactIdQuerySchema.safeParse(
      getQueryParams(request),
    );

    if (!parsed.success) {
      throw new SupplierError(
        SUPPLIER_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "suppliers:write",
    );

    const contact = await supplierService.deleteContact(
      parsed.data.storeId,
      contactId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "supplier_contact",
      entityId: contact.id,
      action: "delete",
      metadata: {
        supplierId: contact.supplierId,
        ...contactAuditMetadata(contact),
      },
    });

    return jsonSuccess({ contact });
  } catch (error) {
    return handleSupplierRouteError(error);
  }
}
