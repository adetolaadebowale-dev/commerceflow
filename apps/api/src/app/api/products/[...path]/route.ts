import {
  handleGetProduct,
  handleUpdateProduct,
} from "@/catalogue/routes/products.route";
import {
  handleDeleteProductMedia,
  handleListProductMedia,
  handleReorderProductMedia,
  handleUploadProductMedia,
} from "@/catalogue/routes/product-media.route";
import {
  handleCreateProductVariant,
  handleDeleteProductVariant,
  handleListProductVariants,
  handleUpdateProductVariant,
} from "@/catalogue/routes/product-variants.route";
import { jsonError } from "@/catalogue/routes/http-response";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

/**
 * Nested product routes (including media and variants) live behind a catch-all
 * because Next.js 16 Turbopack does not reliably register App Router handlers
 * more than two segments under `/api`.
 *
 * Public URLs stay the same:
 * - GET/PATCH /api/products/:id
 * - GET/POST  /api/products/:id/media
 * - DELETE    /api/products/:id/media/:mediaId
 * - PATCH     /api/products/:id/media/order
 * - GET/POST  /api/products/:id/variants
 * - PATCH/DELETE /api/products/:id/variants/:variantId
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;

  if (path.length === 1) {
    return handleGetProduct(path[0]!, request);
  }

  if (path.length === 2 && path[1] === "media") {
    return handleListProductMedia(path[0]!, request);
  }

  if (path.length === 2 && path[1] === "variants") {
    return handleListProductVariants(path[0]!, request);
  }

  return jsonError(
    {
      code: "NOT_FOUND",
      message: `Product route not found: /api/products/${path.join("/")}`,
    },
    404,
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;

  if (path.length === 1) {
    return handleUpdateProduct(path[0]!, request);
  }

  if (path.length === 3 && path[1] === "media" && path[2] === "order") {
    return handleReorderProductMedia(path[0]!, request);
  }

  if (path.length === 3 && path[1] === "variants") {
    return handleUpdateProductVariant(path[0]!, path[2]!, request);
  }

  return jsonError(
    {
      code: "NOT_FOUND",
      message: `Product route not found: /api/products/${path.join("/")}`,
    },
    404,
  );
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;

  if (path.length === 2 && path[1] === "media") {
    return handleUploadProductMedia(path[0]!, request);
  }

  if (path.length === 2 && path[1] === "variants") {
    return handleCreateProductVariant(path[0]!, request);
  }

  return jsonError(
    {
      code: "NOT_FOUND",
      message: `Product route not found: /api/products/${path.join("/")}`,
    },
    404,
  );
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { path } = await context.params;

  if (path.length === 3 && path[1] === "media") {
    return handleDeleteProductMedia(path[0]!, path[2]!, request);
  }

  if (path.length === 3 && path[1] === "variants") {
    return handleDeleteProductVariant(path[0]!, path[2]!, request);
  }

  return jsonError(
    {
      code: "NOT_FOUND",
      message: `Product route not found: /api/products/${path.join("/")}`,
    },
    404,
  );
}
