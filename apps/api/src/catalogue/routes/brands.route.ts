import {
  brandIdQuerySchema,
  createBrandSchema,
  listBrandsQuerySchema,
  updateBrandSchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { auditService } from "@/audit/services";
import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import { brandService } from "../services";
import { handleCatalogueRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateBrand(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createBrandSchema.safeParse(body);

    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "catalogue:write",
    );

    const brand = await brandService.createBrand(parsed.data);
    auditService.recordFromAuthContext(authContext, {
      entityType: "brand",
      entityId: brand.id,
      action: "create",
      metadata: { name: brand.name, slug: brand.slug },
    });
    return jsonSuccess({ brand }, 201);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleListBrands(request: Request): Promise<Response> {
  try {
    const parsed = listBrandsQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "catalogue:read",
    );

    const result = await brandService.listBrands(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleGetBrand(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = brandIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "catalogue:read",
    );

    const brand = await brandService.getBrand(parsed.data.storeId, id);
    return jsonSuccess({ brand });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleUpdateBrand(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = brandIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateBrandSchema.safeParse(body);

    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "catalogue:write",
    );

    const brand = await brandService.updateBrand(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "brand",
      entityId: brand.id,
      action: "update",
      metadata: { name: brand.name, slug: brand.slug },
    });
    return jsonSuccess({ brand });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleDeleteBrand(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = brandIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "catalogue:write",
    );

    const brand = await brandService.deleteBrand(parsed.data.storeId, id);
    auditService.recordFromAuthContext(authContext, {
      entityType: "brand",
      entityId: brand.id,
      action: "delete",
      metadata: { name: brand.name, slug: brand.slug },
    });
    return jsonSuccess({ brand });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}
