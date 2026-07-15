import type {
  CatalogueListResult,
  Promotion,
} from "@commerceflow/types";
import type {
  CreatePromotionInput,
  ListPromotionsQuery,
  UpdatePromotionInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /promotions */
export type CreatePromotionRequest = CreatePromotionInput;
export type CreatePromotionResponse = ApiSuccessResponse<{ promotion: Promotion }>;

/** PATCH /promotions/:id */
export type UpdatePromotionRequest = UpdatePromotionInput;
export type UpdatePromotionResponse = ApiSuccessResponse<{ promotion: Promotion }>;

/** GET /promotions/:id */
export type GetPromotionResponse = ApiSuccessResponse<{ promotion: Promotion }>;

/** DELETE /promotions/:id */
export type DeletePromotionResponse = ApiSuccessResponse<{ promotion: Promotion }>;

/** GET /promotions */
export type ListPromotionsParams = ListPromotionsQuery;
export type ListPromotionsResponse = ApiSuccessResponse<
  CatalogueListResult<Promotion>
>;

export type PromotionStoreScopedParams = Pick<ListPromotionsQuery, "storeId">;
