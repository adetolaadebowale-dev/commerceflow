import {
  createProductSchema,
  listProductsQuerySchema,
  productIdQuerySchema,
  updateProductSchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { auditService } from "@/audit/services";
import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import { productService } from "../services";
import { handleCatalogueRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateProduct(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);

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

    const product = await productService.createProduct(parsed.data);
    auditService.recordFromAuthContext(authContext, {
      entityType: "product",
      entityId: product.id,
      action: "create",
      metadata: { name: product.name, slug: product.slug, status: product.status },
    });
    return jsonSuccess({ product }, 201);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleListProducts(request: Request): Promise<Response> {
  try {
    const parsed = listProductsQuerySchema.safeParse(getQueryParams(request));

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

    const result = await productService.listProducts(parsed.data);
    return jsonSuccess(result);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleGetProduct(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = productIdQuerySchema.safeParse(getQueryParams(request));

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

    const product = await productService.getProduct(parsed.data.storeId, id);
    return jsonSuccess({ product });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleUpdateProduct(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = productIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateProductSchema.safeParse(body);

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

    const product = await productService.updateProduct(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "product",
      entityId: product.id,
      action: "update",
      metadata: { name: product.name, slug: product.slug, status: product.status },
    });
    return jsonSuccess({ product });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}
