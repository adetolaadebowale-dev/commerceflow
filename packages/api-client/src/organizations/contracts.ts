import type { Organization, OrganizationStoreSummary } from "@commerceflow/types";
import type { UpdateOrganizationInput } from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type GetOrganizationResponse = ApiSuccessResponse<{
  organization: Organization;
}>;

export type UpdateOrganizationRequest = UpdateOrganizationInput;
export type UpdateOrganizationResponse = ApiSuccessResponse<{
  organization: Organization;
}>;

export type ListOrganizationStoresResponse = ApiSuccessResponse<{
  stores: readonly OrganizationStoreSummary[];
}>;
