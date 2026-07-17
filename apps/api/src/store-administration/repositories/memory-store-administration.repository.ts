import {
  DEFAULT_STORE_SETTINGS,
  type StoreConfiguration,
  type StoreSettings,
} from "@commerceflow/types";
import type { UpdateStoreSettingsInput } from "@commerceflow/validation";

import type { StoreAdministrationRepository } from "./store-administration.repository";

function buildSettingsUpdate(
  existing: StoreSettings,
  input: UpdateStoreSettingsInput,
): StoreSettings {
  return {
    defaultCurrency: input.defaultCurrency ?? existing.defaultCurrency,
    defaultTimezone: input.defaultTimezone ?? existing.defaultTimezone,
    locale: input.locale ?? existing.locale,
  };
}

export class MemoryStoreAdministrationRepository
  implements StoreAdministrationRepository
{
  private readonly storesById = new Map<string, StoreConfiguration>();
  private transactionFailure: Error | null = null;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  seedStore(
    input: Partial<StoreConfiguration> &
      Pick<StoreConfiguration, "id" | "organizationId" | "name" | "slug">,
  ): StoreConfiguration {
    const now = new Date().toISOString();
    const store: StoreConfiguration = {
      settings: DEFAULT_STORE_SETTINGS,
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    this.storesById.set(store.id, store);
    return store;
  }

  async findById(storeId: string): Promise<StoreConfiguration | null> {
    return this.storesById.get(storeId) ?? null;
  }

  async findByOrganizationAndSlug(
    organizationId: string,
    slug: string,
  ): Promise<StoreConfiguration | null> {
    for (const store of this.storesById.values()) {
      if (store.organizationId === organizationId && store.slug === slug) {
        return store;
      }
    }

    return null;
  }

  async updateSettings(
    storeId: string,
    input: UpdateStoreSettingsInput,
  ): Promise<StoreConfiguration> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const existing = this.storesById.get(storeId);

    if (!existing) {
      throw new Error("Store not found");
    }

    const updated: StoreConfiguration = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      settings: buildSettingsUpdate(existing.settings, input),
      updatedAt: new Date().toISOString(),
    };

    this.storesById.set(storeId, updated);
    return updated;
  }
}
