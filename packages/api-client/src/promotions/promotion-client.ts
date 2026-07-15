import type {
  CreatePromotionRequest,
  CreatePromotionResponse,
  DeletePromotionResponse,
  GetPromotionResponse,
  ListPromotionsParams,
  ListPromotionsResponse,
  PromotionStoreScopedParams,
  UpdatePromotionRequest,
  UpdatePromotionResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

function toQueryString(params: PromotionStoreScopedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function toListQueryString(params: ListPromotionsParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("storeId", params.storeId);
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface PromotionClient {
  createPromotion(
    input: CreatePromotionRequest,
  ): Promise<CreatePromotionResponse["data"]>;
  listPromotions(
    params: ListPromotionsParams,
  ): Promise<ListPromotionsResponse["data"]>;
  getPromotion(
    id: string,
    params: PromotionStoreScopedParams,
  ): Promise<GetPromotionResponse["data"]>;
  updatePromotion(
    id: string,
    input: UpdatePromotionRequest,
    params: PromotionStoreScopedParams,
  ): Promise<UpdatePromotionResponse["data"]>;
  deletePromotion(
    id: string,
    params: PromotionStoreScopedParams,
  ): Promise<DeletePromotionResponse["data"]>;
}

export function createPromotionClient(config: ApiClientConfig): PromotionClient {
  return {
    createPromotion: (input) =>
      apiRequest<CreatePromotionResponse["data"]>(config, {
        method: "POST",
        path: "/api/promotions",
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listPromotions: (params) =>
      apiRequest<ListPromotionsResponse["data"]>(config, {
        method: "GET",
        path: `/api/promotions${toListQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    getPromotion: (id, params) =>
      apiRequest<GetPromotionResponse["data"]>(config, {
        method: "GET",
        path: `/api/promotions/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),

    updatePromotion: (id, input, params) =>
      apiRequest<UpdatePromotionResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/promotions/${id}${toQueryString(params)}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    deletePromotion: (id, params) =>
      apiRequest<DeletePromotionResponse["data"]>(config, {
        method: "DELETE",
        path: `/api/promotions/${id}${toQueryString(params)}`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
