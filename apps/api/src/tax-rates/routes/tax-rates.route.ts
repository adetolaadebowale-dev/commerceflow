import {
  createTaxRateSchema,
  listTaxRatesQuerySchema,
  taxRateIdQuerySchema,
  updateTaxRateSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { TAX_RATE_ERROR_CODES, TaxRateError } from "../errors";
import { taxRateService } from "../services";
import { handleTaxRateRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function taxRateAuditMetadata(taxRate: {
  name: string;
  percentage: string;
  status: string;
}) {
  return {
    name: taxRate.name,
    percentage: taxRate.percentage,
    status: taxRate.status,
  };
}

export async function handleCreateTaxRate(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createTaxRateSchema.safeParse(body);

    if (!parsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "tax-rates:write",
    );

    const taxRate = await taxRateService.createTaxRate(parsed.data);

    auditService.recordFromAuthContext(authContext, {
      entityType: "tax_rate",
      entityId: taxRate.id,
      action: "create",
      metadata: taxRateAuditMetadata(taxRate),
    });

    if (taxRate.status === "active") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "tax_rate",
        entityId: taxRate.id,
        action: "activate",
        metadata: taxRateAuditMetadata(taxRate),
      });
    }

    return jsonSuccess({ taxRate }, 201);
  } catch (error) {
    return handleTaxRateRouteError(error);
  }
}

export async function handleListTaxRates(request: Request): Promise<Response> {
  try {
    const parsed = listTaxRatesQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "tax-rates:read",
    );

    const result = await taxRateService.listTaxRates(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleTaxRateRouteError(error);
  }
}

export async function handleGetTaxRate(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = taxRateIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "tax-rates:read",
    );

    const taxRate = await taxRateService.getTaxRate(parsed.data.storeId, id);
    return jsonSuccess({ taxRate });
  } catch (error) {
    return handleTaxRateRouteError(error);
  }
}

export async function handleUpdateTaxRate(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = taxRateIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateTaxRateSchema.safeParse(body);

    if (!parsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "tax-rates:write",
    );

    const existing = await taxRateService.getTaxRate(
      queryParsed.data.storeId,
      id,
    );
    const taxRate = await taxRateService.updateTaxRate(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "tax_rate",
      entityId: taxRate.id,
      action: "update",
      metadata: taxRateAuditMetadata(taxRate),
    });

    if (existing.status !== taxRate.status) {
      auditService.recordFromAuthContext(authContext, {
        entityType: "tax_rate",
        entityId: taxRate.id,
        action: taxRate.status === "active" ? "activate" : "deactivate",
        metadata: taxRateAuditMetadata(taxRate),
      });
    }

    return jsonSuccess({ taxRate });
  } catch (error) {
    return handleTaxRateRouteError(error);
  }
}

export async function handleDeleteTaxRate(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = taxRateIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "tax-rates:write",
    );

    const existing = await taxRateService.getTaxRate(parsed.data.storeId, id);
    const taxRate = await taxRateService.softDeleteTaxRate(
      parsed.data.storeId,
      id,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "tax_rate",
      entityId: taxRate.id,
      action: "delete",
      metadata: taxRateAuditMetadata(taxRate),
    });

    if (existing.status === "active") {
      auditService.recordFromAuthContext(authContext, {
        entityType: "tax_rate",
        entityId: taxRate.id,
        action: "deactivate",
        metadata: taxRateAuditMetadata(taxRate),
      });
    }

    return jsonSuccess({ taxRate });
  } catch (error) {
    return handleTaxRateRouteError(error);
  }
}

export async function handleActivateTaxRate(
  id: string,
  request: Request,
): Promise<Response> {
  return handleTaxRateLifecycleAction(id, request, "activate", (storeId) =>
    taxRateService.activateTaxRate(storeId, id),
  );
}

export async function handleDeactivateTaxRate(
  id: string,
  request: Request,
): Promise<Response> {
  return handleTaxRateLifecycleAction(id, request, "deactivate", (storeId) =>
    taxRateService.deactivateTaxRate(storeId, id),
  );
}

async function handleTaxRateLifecycleAction(
  id: string,
  request: Request,
  action: "activate" | "deactivate",
  execute: (storeId: string) => Promise<{
    id: string;
    name: string;
    percentage: string;
    status: string;
  }>,
): Promise<Response> {
  try {
    const parsed = taxRateIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new TaxRateError(
        TAX_RATE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "tax-rates:write",
    );

    const taxRate = await execute(parsed.data.storeId);

    auditService.recordFromAuthContext(authContext, {
      entityType: "tax_rate",
      entityId: taxRate.id,
      action,
      metadata: taxRateAuditMetadata(taxRate),
    });

    return jsonSuccess({ taxRate });
  } catch (error) {
    return handleTaxRateRouteError(error);
  }
}
