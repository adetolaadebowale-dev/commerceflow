import type { PickList } from "@commerceflow/types";
import type {
  CreatePickListInput,
  PickListIdQuery,
  PickListQuery,
  UpdatePickListInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

export type PickListParams = PickListQuery;
export type PickListIdParams = PickListIdQuery;
export type CreatePickListRequest = CreatePickListInput;
export type CompletePickListRequest = UpdatePickListInput;

export type CreatePickListResponse = ApiSuccessResponse<{ pickList: PickList }>;
export type GetPickListResponse = ApiSuccessResponse<{ pickList: PickList }>;
export type ListPickListsResponse = ApiSuccessResponse<{
  pickLists: readonly PickList[];
}>;
export type PickListActionResponse = ApiSuccessResponse<{ pickList: PickList }>;
