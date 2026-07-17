import {
  Prisma,
  type PrismaClient,
  type Store as PrismaStore,
} from "@prisma/client";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreConfiguration,
  type StoreSettings,
} from "@commerceflow/types";
import type { UpdateStoreSettingsInput } from "@commerceflow/validation";

import type { StoreAdministrationRepository } from "./store-administration.repository";

function toStoreSettings(value: Prisma.JsonValue): StoreSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_STORE_SETTINGS;
  }

  const record = value as Record<string, unknown>;

  return {
    defaultCurrency:
      typeof record.defaultCurrency === "string"
        ? record.defaultCurrency
        : DEFAULT_STORE_SETTINGS.defaultCurrency,
    defaultTimezone:
      typeof record.defaultTimezone === "string"
        ? record.defaultTimezone
        : DEFAULT_STORE_SETTINGS.defaultTimezone,
    locale:
      typeof record.locale === "string"
        ? record.locale
        : DEFAULT_STORE_SETTINGS.locale,
  };
}

function toStoreConfiguration(record: PrismaStore): StoreConfiguration {
  return {
    id: record.id,
    organizationId: record.organizationId,
    name: record.name,
    slug: record.slug,
    settings: toStoreSettings(record.settings),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

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

export class PrismaStoreAdministrationRepository
  implements StoreAdministrationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(storeId: string): Promise<StoreConfiguration | null> {
    const record = await this.db.store.findFirst({
      where: { id: storeId, deletedAt: null },
    });

    return record ? toStoreConfiguration(record) : null;
  }

  async findByOrganizationAndSlug(
    organizationId: string,
    slug: string,
  ): Promise<StoreConfiguration | null> {
    const record = await this.db.store.findFirst({
      where: { organizationId, slug, deletedAt: null },
    });

    return record ? toStoreConfiguration(record) : null;
  }

  async updateSettings(
    storeId: string,
    input: UpdateStoreSettingsInput,
  ): Promise<StoreConfiguration> {
    const existing = await this.findById(storeId);

    if (!existing) {
      throw new Error("Store not found");
    }

    const record = await this.db.store.update({
      where: { id: storeId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        settings: buildSettingsUpdate(
          existing.settings,
          input,
        ) as unknown as Prisma.InputJsonValue,
      },
    });

    return toStoreConfiguration(record);
  }
}
