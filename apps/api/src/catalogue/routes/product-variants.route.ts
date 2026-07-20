import {
  createProductVariantSchema,
  productVariantIdQuerySchema,
  updateProductVariantSchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { auditService } from "@/audit/services";
import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import { productVariantService } from "../services";
import { handleCatalogueRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function handleListProductVariants(
  productId: string,
  request: Request,
): Promise<Response> {
  try {
    if (!isUuid(productId)) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Product id must be a valid UUID",
        400,
      );
    }

    const parsed = productVariantIdQuerySchema.safeParse(
      getQueryParams(request),
    );
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

    const result = await productVariantService.listProductVariants(
      parsed.data.storeId,
      productId,
    );
    return jsonSuccess(result);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleCreateProductVariant(
  productId: string,
  request: Request,
): Promise<Response> {
  try {
    if (!isUuid(productId)) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Product id must be a valid UUID",
        400,
      );
    }

    const queryParsed = productVariantIdQuerySchema.safeParse(
      getQueryParams(request),
    );
    if (!queryParsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "catalogue:write",
    );

    const body: unknown = await request.json();
    const parsed = createProductVariantSchema.safeParse(body);
    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const variant = await productVariantService.createProductVariant(
      queryParsed.data.storeId,
      productId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "product_variant",
      entityId: variant.id,
      action: "create",
      metadata: {
        productId: variant.productId,
        sku: variant.sku,
      },
    });

    return jsonSuccess({ variant }, 201);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleUpdateProductVariant(
  productId: string,
  variantId: string,
  request: Request,
): Promise<Response> {
  try {
    if (!isUuid(productId) || !isUuid(variantId)) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Product id and variant id must be valid UUIDs",
        400,
      );
    }

    const queryParsed = productVariantIdQuerySchema.safeParse(
      getQueryParams(request),
    );
    if (!queryParsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "catalogue:write",
    );

    const body: unknown = await request.json();
    const parsed = updateProductVariantSchema.safeParse(body);
    if (!parsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const variant = await productVariantService.updateProductVariant(
      queryParsed.data.storeId,
      productId,
      variantId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "product_variant",
      entityId: variant.id,
      action: "update",
      metadata: {
        productId: variant.productId,
        sku: variant.sku,
      },
    });

    return jsonSuccess({ variant });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleDeleteProductVariant(
  productId: string,
  variantId: string,
  request: Request,
): Promise<Response> {
  try {
    if (!isUuid(productId) || !isUuid(variantId)) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Product id and variant id must be valid UUIDs",
        400,
      );
    }

    const parsed = productVariantIdQuerySchema.safeParse(
      getQueryParams(request),
    );
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

    const variant = await productVariantService.deleteProductVariant(
      parsed.data.storeId,
      productId,
      variantId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "product_variant",
      entityId: variant.id,
      action: "delete",
      metadata: {
        productId: variant.productId,
        sku: variant.sku,
      },
    });

    return jsonSuccess({ variant });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}
