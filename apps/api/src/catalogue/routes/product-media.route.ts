import {
  productMediaIdQuerySchema,
  productMediaUploadMetaSchema,
  reorderProductMediaSchema,
} from "@commerceflow/validation";

import { authorizationService } from "@/authorization/services";
import { auditService } from "@/audit/services";
import { CATALOGUE_ERROR_CODES, CatalogueError } from "../errors";
import { productMediaService } from "../services";
import { handleCatalogueRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function handleListProductMedia(
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

    const parsed = productMediaIdQuerySchema.safeParse(getQueryParams(request));
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

    const result = await productMediaService.listProductMedia(
      parsed.data.storeId,
      productId,
    );
    return jsonSuccess(result);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleUploadProductMedia(
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

    const queryParsed = productMediaIdQuerySchema.safeParse(
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

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Multipart field 'file' is required",
        400,
      );
    }

    const altTextRaw = formData.get("altText");
    const metaParsed = productMediaUploadMetaSchema.safeParse({
      ...(typeof altTextRaw === "string" ? { altText: altTextRaw } : {}),
    });
    if (!metaParsed.success) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        metaParsed.error.flatten(),
      );
    }

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const media = await productMediaService.uploadProductMedia(
      queryParsed.data.storeId,
      productId,
      {
        buffer,
        mimeType: fileEntry.type || "application/octet-stream",
        originalFilename: fileEntry.name || "upload",
        sizeBytes: buffer.byteLength,
      },
      metaParsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "product_media",
      entityId: media.id,
      action: "product.media.uploaded",
      metadata: {
        productId: media.productId,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        sortOrder: media.sortOrder,
      },
    });

    return jsonSuccess({ media }, 201);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleDeleteProductMedia(
  productId: string,
  mediaId: string,
  request: Request,
): Promise<Response> {
  try {
    if (!isUuid(productId) || !isUuid(mediaId)) {
      throw new CatalogueError(
        CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
        "Product id and media id must be valid UUIDs",
        400,
      );
    }

    const parsed = productMediaIdQuerySchema.safeParse(getQueryParams(request));
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

    const media = await productMediaService.deleteProductMedia(
      parsed.data.storeId,
      productId,
      mediaId,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "product_media",
      entityId: media.id,
      action: "product.media.deleted",
      metadata: {
        productId: media.productId,
        storageKey: media.storageKey,
      },
    });

    return jsonSuccess({ media });
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}

export async function handleReorderProductMedia(
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

    const queryParsed = productMediaIdQuerySchema.safeParse(
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

    const body: unknown = await request.json();
    const parsed = reorderProductMediaSchema.safeParse(body);
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

    const result = await productMediaService.reorderProductMedia(
      queryParsed.data.storeId,
      productId,
      parsed.data,
    );

    auditService.recordFromAuthContext(authContext, {
      entityType: "product_media",
      entityId: productId,
      action: "product.media.reordered",
      metadata: {
        productId,
        orderedMediaIds: parsed.data.orderedMediaIds,
      },
    });

    return jsonSuccess(result);
  } catch (error) {
    return handleCatalogueRouteError(error);
  }
}
