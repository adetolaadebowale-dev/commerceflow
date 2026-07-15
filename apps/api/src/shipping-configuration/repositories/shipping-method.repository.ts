import type {
  CatalogueListResult,
  ShippingMethod,
} from "@commerceflow/types";
import type {
  CreateShippingMethodInput,
  ListShippingMethodsQuery,
  UpdateShippingMethodInput,
} from "@commerceflow/validation";

export interface ShippingMethodRepository {
  findById(storeId: string, id: string): Promise<ShippingMethod | null>;
  list(
    query: ListShippingMethodsQuery,
  ): Promise<CatalogueListResult<ShippingMethod>>;
  countActiveByZoneId(storeId: string, shippingZoneId: string): Promise<number>;
  create(input: CreateShippingMethodInput): Promise<ShippingMethod>;
  update(
    storeId: string,
    id: string,
    input: UpdateShippingMethodInput,
  ): Promise<ShippingMethod>;
  softDelete(storeId: string, id: string): Promise<ShippingMethod>;
}
