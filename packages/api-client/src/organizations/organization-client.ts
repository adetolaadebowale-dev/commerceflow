import type {
  GetOrganizationResponse,
  ListOrganizationStoresResponse,
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
} from "./contracts";
import type { ApiClientConfig } from "../http/request";
import { apiRequest } from "../http/request";

export interface OrganizationClient {
  getOrganization(id: string): Promise<GetOrganizationResponse["data"]>;
  updateOrganization(
    id: string,
    input: UpdateOrganizationRequest,
  ): Promise<UpdateOrganizationResponse["data"]>;
  listOrganizationStores(
    id: string,
  ): Promise<ListOrganizationStoresResponse["data"]>;
}

export function createOrganizationClient(
  config: ApiClientConfig,
): OrganizationClient {
  return {
    getOrganization: (id) =>
      apiRequest<GetOrganizationResponse["data"]>(config, {
        method: "GET",
        path: `/api/organizations/${id}`,
        accessToken: config.getAccessToken?.(),
      }),

    updateOrganization: (id, input) =>
      apiRequest<UpdateOrganizationResponse["data"]>(config, {
        method: "PATCH",
        path: `/api/organizations/${id}`,
        body: input,
        accessToken: config.getAccessToken?.(),
      }),

    listOrganizationStores: (id) =>
      apiRequest<ListOrganizationStoresResponse["data"]>(config, {
        method: "GET",
        path: `/api/organizations/${id}/stores`,
        accessToken: config.getAccessToken?.(),
      }),
  };
}
