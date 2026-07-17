import type { StoreConfiguration } from "@commerceflow/types";
import type { UpdateStoreSettingsInput } from "@commerceflow/validation";

export interface StoreAdministrationRepository {
  findById(storeId: string): Promise<StoreConfiguration | null>;
  findByOrganizationAndSlug(
    organizationId: string,
    slug: string,
  ): Promise<StoreConfiguration | null>;
  updateSettings(
    storeId: string,
    input: UpdateStoreSettingsInput,
  ): Promise<StoreConfiguration>;
}
