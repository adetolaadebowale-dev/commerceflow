import {
  categoryIdQuerySchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { auditService } from "@/audit/services";
import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import { categoryService } from "../services";
import { handleCatalogueRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateCategory(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createCategorySchema.safeParse(body);

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

    const category = await categoryService.createCategory(parsed.data);
    auditService.recordFromAuthContext(authContext, {
      entityType: "category",
      entityId: category.id,
      action: "create",
      metadata: { name: category.name, slug: category.slug },
    });
    return jsonSuccess({ category }, 201);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleListCategories(request: Request): Promise<Response> {
  try {
    const parsed = listCategoriesQuerySchema.safeParse(getQueryParams(request));

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

    const result = await categoryService.listCategories(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleGetCategory(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = categoryIdQuerySchema.safeParse(getQueryParams(request));

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

    const category = await categoryService.getCategory(parsed.data.storeId, id);
    return jsonSuccess({ category });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleUpdateCategory(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = categoryIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

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

    const category = await categoryService.updateCategory(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "category",
      entityId: category.id,
      action: "update",
      metadata: { name: category.name, slug: category.slug },
    });
    return jsonSuccess({ category });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}
