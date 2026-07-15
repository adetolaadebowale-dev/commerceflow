import type { Cart } from "@commerceflow/types";
import type {
  AddCartItemInput,
  ApplyCartPromotionInput,
  CreateCartInput,
  UpdateCartItemInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /carts */
export type CreateCartRequest = CreateCartInput;
export type CreateCartResponse = ApiSuccessResponse<{ cart: Cart }>;

/** GET /carts/:id */
export type GetCartResponse = ApiSuccessResponse<{ cart: Cart }>;

/** GET /customers/:id/cart */
export type GetCustomerCartResponse = ApiSuccessResponse<{ cart: Cart }>;

/** POST /carts/:id/items */
export type AddCartItemRequest = AddCartItemInput;
export type AddCartItemResponse = ApiSuccessResponse<{ cart: Cart }>;

/** PATCH /cart-items/:id */
export type UpdateCartItemRequest = UpdateCartItemInput;
export type UpdateCartItemResponse = ApiSuccessResponse<{ cart: Cart }>;

/** DELETE /cart-items/:id */
export type RemoveCartItemResponse = ApiSuccessResponse<{ cart: Cart }>;

/** POST /carts/:id/apply-promotion */
export type ApplyCartPromotionRequest = ApplyCartPromotionInput;
export type ApplyCartPromotionResponse = ApiSuccessResponse<{ cart: Cart }>;

/** DELETE /carts/:id/promotion */
export type RemoveCartPromotionResponse = ApiSuccessResponse<{ cart: Cart }>;

export interface StoreScopedParams {
  readonly storeId: string;
}
