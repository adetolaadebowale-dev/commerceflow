import type {
  AcceptReplenishmentRecommendationResult,
  CatalogueListResult,
  ReplenishmentRecommendation,
  ReplenishmentRule,
} from "@commerceflow/types";
import type {
  AcceptReplenishmentRecommendationInput,
  CreateReplenishmentRuleInput,
  GenerateReplenishmentRecommendationsInput,
  ListReplenishmentRecommendationsQuery,
  ListReplenishmentRulesQuery,
  UpdateReplenishmentRuleInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type CreateReplenishmentRuleRequest = CreateReplenishmentRuleInput;
export type CreateReplenishmentRuleResponse = ApiSuccessResponse<{
  rule: ReplenishmentRule;
}>;

export type UpdateReplenishmentRuleRequest = UpdateReplenishmentRuleInput;
export type UpdateReplenishmentRuleResponse = ApiSuccessResponse<{
  rule: ReplenishmentRule;
}>;

export type GetReplenishmentRuleResponse = ApiSuccessResponse<{
  rule: ReplenishmentRule;
}>;

export type DeleteReplenishmentRuleResponse = ApiSuccessResponse<{
  rule: ReplenishmentRule;
}>;

export type ListReplenishmentRulesParams = ListReplenishmentRulesQuery;
export type ListReplenishmentRulesResponse = ApiSuccessResponse<
  CatalogueListResult<ReplenishmentRule>
>;

export type ReplenishmentRuleStoreScopedParams = Pick<
  ListReplenishmentRulesQuery,
  "storeId"
>;

export type GenerateReplenishmentRecommendationsRequest =
  GenerateReplenishmentRecommendationsInput;
export type GenerateReplenishmentRecommendationsResponse = ApiSuccessResponse<{
  recommendations: readonly ReplenishmentRecommendation[];
}>;

export type ListReplenishmentRecommendationsParams =
  ListReplenishmentRecommendationsQuery;
export type ListReplenishmentRecommendationsResponse = ApiSuccessResponse<
  CatalogueListResult<ReplenishmentRecommendation>
>;

export type GetReplenishmentRecommendationResponse = ApiSuccessResponse<{
  recommendation: ReplenishmentRecommendation;
}>;

export type ReplenishmentRecommendationStoreScopedParams = Pick<
  ListReplenishmentRecommendationsQuery,
  "storeId"
>;

export type AcceptReplenishmentRecommendationRequest =
  AcceptReplenishmentRecommendationInput;
export type AcceptReplenishmentRecommendationResponse =
  ApiSuccessResponse<AcceptReplenishmentRecommendationResult>;

export type DismissReplenishmentRecommendationRequest = Pick<
  AcceptReplenishmentRecommendationInput,
  "storeId"
>;
export type DismissReplenishmentRecommendationResponse = ApiSuccessResponse<{
  recommendation: ReplenishmentRecommendation;
}>;
