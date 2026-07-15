import type {
  CatalogueListResult,
  ShippingZone,
} from "@commerceflow/types";
import type {
  CreateShippingZoneInput,
  ListShippingZonesQuery,
  UpdateShippingZoneInput,
} from "@commerceflow/validation";

export interface ShippingZoneRepository {
  findById(storeId: string, id: string): Promise<ShippingZone | null>;
  list(query: ListShippingZonesQuery): Promise<CatalogueListResult<ShippingZone>>;
  create(input: CreateShippingZoneInput): Promise<ShippingZone>;
  update(
    storeId: string,
    id: string,
    input: UpdateShippingZoneInput,
  ): Promise<ShippingZone>;
  softDelete(storeId: string, id: string): Promise<ShippingZone>;
}
