import {
  categoryIdQuerySchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "@commerceflow/validation";

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

    const category = await categoryService.createCategory(parsed.data);
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

    const category = await categoryService.updateCategory(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    return jsonSuccess({ category });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}
