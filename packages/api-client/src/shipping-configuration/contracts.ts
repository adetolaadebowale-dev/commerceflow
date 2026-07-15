import type {
  CatalogueListResult,
  ShippingMethod,
  ShippingZone,
} from "@commerceflow/types";
import type {
  CreateShippingMethodInput,
  CreateShippingZoneInput,
  ListShippingMethodsQuery,
  ListShippingZonesQuery,
  UpdateShippingMethodInput,
  UpdateShippingZoneInput,
} from "@commerceflow/validation";

import type { ApiSuccessResponse } from "../common/api-response";

/** POST /shipping-zones */
export type CreateShippingZoneRequest = CreateShippingZoneInput;
export type CreateShippingZoneResponse = ApiSuccessResponse<{
  shippingZone: ShippingZone;
}>;

/** PATCH /shipping-zones/:id */
export type UpdateShippingZoneRequest = UpdateShippingZoneInput;
export type UpdateShippingZoneResponse = ApiSuccessResponse<{
  shippingZone: ShippingZone;
}>;

/** GET /shipping-zones/:id */
export type GetShippingZoneResponse = ApiSuccessResponse<{
  shippingZone: ShippingZone;
}>;

/** DELETE /shipping-zones/:id */
export type DeleteShippingZoneResponse = ApiSuccessResponse<{
  shippingZone: ShippingZone;
}>;

/** GET /shipping-zones */
export type ListShippingZonesParams = ListShippingZonesQuery;
export type ListShippingZonesResponse = ApiSuccessResponse<
  CatalogueListResult<ShippingZone>
>;

export type ShippingZoneStoreScopedParams = Pick<ListShippingZonesQuery, "storeId">;

/** POST /shipping-methods */
export type CreateShippingMethodRequest = CreateShippingMethodInput;
export type CreateShippingMethodResponse = ApiSuccessResponse<{
  shippingMethod: ShippingMethod;
}>;

/** PATCH /shipping-methods/:id */
export type UpdateShippingMethodRequest = UpdateShippingMethodInput;
export type UpdateShippingMethodResponse = ApiSuccessResponse<{
  shippingMethod: ShippingMethod;
}>;

/** GET /shipping-methods/:id */
export type GetShippingMethodResponse = ApiSuccessResponse<{
  shippingMethod: ShippingMethod;
}>;

/** DELETE /shipping-methods/:id */
export type DeleteShippingMethodResponse = ApiSuccessResponse<{
  shippingMethod: ShippingMethod;
}>;

/** GET /shipping-methods */
export type ListShippingMethodsParams = ListShippingMethodsQuery;
export type ListShippingMethodsResponse = ApiSuccessResponse<
  CatalogueListResult<ShippingMethod>
>;

export type ShippingMethodStoreScopedParams = Pick<ListShippingMethodsQuery, "storeId">;
