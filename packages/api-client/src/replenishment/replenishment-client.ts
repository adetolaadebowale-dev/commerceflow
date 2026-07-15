import type {
  AcceptReplenishmentRecommendationRequest,
  AcceptReplenishmentRecommendationResponse,
  CreateReplenishmentRuleRequest,
  CreateReplenishmentRuleResponse,
  DeleteReplenishmentRuleResponse,
  DismissReplenishmentRecommendationRequest,
  DismissReplenishmentRecommendationResponse,
  GenerateReplenishmentRecommendationsRequest,
  GenerateReplenishmentRecommendationsResponse,
  GetReplenishmentRecommendationResponse,
  GetReplenishmentRuleResponse,
  ListReplenishmentRecommendationsParams,
  ListReplenishmentRecommendationsResponse,
  ListReplenishmentRulesParams,
  ListReplenishmentRulesResponse,
  ReplenishmentRecommendationStoreScopedParams,
  ReplenishmentRuleStoreScopedParams,
  UpdateReplenishmentRuleRequest,
  UpdateReplenishmentRuleResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(
  params: ReplenishmentRuleStoreScopedParams | ReplenishmentRecommendationStoreScopedParams,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toRulesListQueryString(params: ListReplenishmentRulesParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.warehouseId) {
    searchParams.set("warehouseId", params.warehouseId);
  }

  if (params.isEnabled !== undefined) {
    searchParams.set("isEnabled", String(params.isEnabled));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toRecommendationsListQueryString(
  params: ListReplenishmentRecommendationsParams,
): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.warehouseId) {
    searchParams.set("warehouseId", params.warehouseId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface ReplenishmentClient {
  createRule(
    input: CreateReplenishmentRuleRequest,
  ): Promise<CreateReplenishmentRuleResponse["data"]>;
  listRules(
    params: ListReplenishmentRulesParams,
  ): Promise<ListReplenishmentRulesResponse["data"]>;
  getRule(
    id: string,
    params: ReplenishmentRuleStoreScopedParams,
  ): Promise<GetReplenishmentRuleResponse["data"]>;
  updateRule(
    id: string,
    input: UpdateReplenishmentRuleRequest,
    params: ReplenishmentRuleStoreScopedParams,
  ): Promise<UpdateReplenishmentRuleResponse["data"]>;
  deleteRule(
    id: string,
    params: ReplenishmentRuleStoreScopedParams,
  ): Promise<DeleteReplenishmentRuleResponse["data"]>;
  generateRecommendations(
    input: GenerateReplenishmentRecommendationsRequest,
  ): Promise<GenerateReplenishmentRecommendationsResponse["data"]>;
  listRecommendations(
    params: ListReplenishmentRecommendationsParams,
  ): Promise<ListReplenishmentRecommendationsResponse["data"]>;
  getRecommendation(
    id: string,
    params: ReplenishmentRecommendationStoreScopedParams,
  ): Promise<GetReplenishmentRecommendationResponse["data"]>;
  acceptRecommendation(
    id: string,
    input: AcceptReplenishmentRecommendationRequest,
  ): Promise<AcceptReplenishmentRecommendationResponse["data"]>;
  dismissRecommendation(
    id: string,
    input: DismissReplenishmentRecommendationRequest,
  ): Promise<DismissReplenishmentRecommendationResponse["data"]>;
}

export function createReplenishmentClient(
  config: ApiClientConfig,
): ReplenishmentClient {
  return {
    createRule: (input) =>
      apiRequest<CreateReplenishmentRuleResponse["data"]>(config, {
        method: "POST",
        path: "/api/replenishment/rules",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listRules: (params) =>
      apiRequest<ListReplenishmentRulesResponse["data"]>(config, {
        method: "GET",
        path: `/api/replenishment/rules${toRulesListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getRule: (id, params) =>
      apiRequest<GetReplenishmentRuleResponse["data"]>(config, {
        method: "GET",
        path: `/api/replenishment/rules/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateRule: (id, input, params) =>
      apiRequest<UpdateReplenishmentRuleResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/replenishment/rules/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deleteRule: (id, params) =>
      apiRequest<DeleteReplenishmentRuleResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/replenishment/rules/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    generateRecommendations: (input) =>
      apiRequest<GenerateReplenishmentRecommendationsResponse["data"]>(config, {
        method: "POST",
        path: "/api/replenishment/recommendations/generate",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listRecommendations: (params) =>
      apiRequest<ListReplenishmentRecommendationsResponse["data"]>(config, {
        method: "GET",
        path: `/api/replenishment/recommendations${toRecommendationsListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getRecommendation: (id, params) =>
      apiRequest<GetReplenishmentRecommendationResponse["data"]>(config, {
        method: "GET",
        path: `/api/replenishment/recommendations/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    acceptRecommendation: (id, input) =>
      apiRequest<AcceptReplenishmentRecommendationResponse["data"]>(config, {
        method: "POST",
        path: `/api/replenishment/recommendations/${id}/accept`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    dismissRecommendation: (id, input) =>
      apiRequest<DismissReplenishmentRecommendationResponse["data"]>(config, {
        method: "POST",
        path: `/api/replenishment/recommendations/${id}/dismiss`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
