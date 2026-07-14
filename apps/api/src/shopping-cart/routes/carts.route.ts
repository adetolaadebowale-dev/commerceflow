import {
  addCartItemSchema,
  cartIdQuerySchema,
  cartItemIdQuerySchema,
  createCartSchema,
  customerCartQuerySchema,
  updateCartItemSchema,
} from "@commerceflow/validation";

import { auditService } from "@/audit/services";
import { authorizationService } from "@/authorization/services";
import { CART_ERROR_CODES, CartError } from "../errors";
import { cartService } from "../services";
import { handleCartRouteError, jsonSuccess } from "./http-response";
import { getQueryParams } from "./request-utils";

export async function handleCreateCart(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const parsed = createCartSchema.safeParse(body);

    if (!parsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "carts:write",
    );

    const cart = await cartService.createCart(parsed.data);
    auditService.recordFromAuthContext(authContext, {
      entityType: "cart",
      entityId: cart.id,
      action: "create",
      metadata: {
        customerId: cart.customerId,
        status: cart.status,
        itemCount: cart.items.length,
      },
    });

    return jsonSuccess({ cart }, 201);
  } catch (error) {
    return handleCartRouteError(error);
  }
}

export async function handleGetCart(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = cartIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "carts:read",
    );

    const cart = await cartService.getCart(parsed.data.storeId, id);
    return jsonSuccess({ cart });
  } catch (error) {
    return handleCartRouteError(error);
  }
}

export async function handleGetCustomerCart(
  customerId: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = customerCartQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "carts:read",
    );

    const cart = await cartService.getActiveCartByCustomerId(
      parsed.data.storeId,
      customerId,
    );
    return jsonSuccess({ cart });
  } catch (error) {
    return handleCartRouteError(error);
  }
}

export async function handleAddCartItem(
  cartId: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = cartIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = addCartItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "carts:write",
    );

    const cart = await cartService.addCartItem(
      queryParsed.data.storeId,
      cartId,
      parsed.data,
    );
    const addedItem = cart.items.find(
      (item) => item.productVariantId === parsed.data.productVariantId,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "cart_item",
      entityId: addedItem?.id ?? cartId,
      action: "create",
      metadata: {
        cartId: cart.id,
        productVariantId: parsed.data.productVariantId,
        quantity: addedItem?.quantity,
      },
    });

    return jsonSuccess({ cart }, 201);
  } catch (error) {
    return handleCartRouteError(error);
  }
}

export async function handleUpdateCartItem(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const queryParsed = cartItemIdQuerySchema.safeParse(getQueryParams(request));

    if (!queryParsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        queryParsed.error.flatten(),
      );
    }

    const body: unknown = await request.json();
    const parsed = updateCartItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      queryParsed.data.storeId,
      "carts:write",
    );

    const cart = await cartService.updateCartItem(
      queryParsed.data.storeId,
      id,
      parsed.data,
    );
    auditService.recordFromAuthContext(authContext, {
      entityType: "cart_item",
      entityId: id,
      action: "update",
      metadata: {
        cartId: cart.id,
        quantity: parsed.data.quantity,
      },
    });

    return jsonSuccess({ cart });
  } catch (error) {
    return handleCartRouteError(error);
  }
}

export async function handleRemoveCartItem(
  id: string,
  request: Request,
): Promise<Response> {
  try {
    const parsed = cartItemIdQuerySchema.safeParse(getQueryParams(request));

    if (!parsed.success) {
      throw new CartError(
        CART_ERROR_CODES.VALIDATION_ERROR,
        "Validation failed",
        400,
        parsed.error.flatten(),
      );
    }

    const authContext = await authorizationService.authorizeStoreRequest(
      request,
      parsed.data.storeId,
      "carts:write",
    );

    const cart = await cartService.removeCartItem(parsed.data.storeId, id);
    auditService.recordFromAuthContext(authContext, {
      entityType: "cart_item",
      entityId: id,
      action: "delete",
      metadata: {
        cartId: cart.id,
      },
    });

    return jsonSuccess({ cart });
  } catch (error) {
    return handleCartRouteError(error);
  }
}
