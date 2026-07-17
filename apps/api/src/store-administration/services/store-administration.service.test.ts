import { describe, expect, it } from "vitest";

import { updateStoreSettingsSchema } from "@commerceflow/validation";

import { STORE_ADMINISTRATION_ERROR_CODES } from "../errors";
import {
  createMemoryStoreAdministrationModule,
  seedStore,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validUpdateStoreSettingsInput,
} from "../testing/store-administration-test-utils";

describe("StoreAdministrationService", () => {
  it("retrieves store configuration with default settings", async () => {
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository);

    const store = await module.storeAdministrationService.getStoreSettings(
      TEST_STORE_A_ID,
    );

    expect(store).toMatchObject({
      id: TEST_STORE_A_ID,
      name: "Main Store",
      slug: "main-store",
      settings: {
        defaultCurrency: "USD",
        defaultTimezone: "UTC",
        locale: "en-US",
      },
    });
  });

  it("updates store profile and settings fields", async () => {
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository);

    const store = await module.storeAdministrationService.updateStoreSettings(
      TEST_STORE_A_ID,
      {
        name: "Updated Store",
        slug: "updated-store",
        defaultCurrency: "EUR",
        defaultTimezone: "Europe/Berlin",
        locale: "de-DE",
      },
    );

    expect(store).toMatchObject({
      name: "Updated Store",
      slug: "updated-store",
      settings: {
        defaultCurrency: "EUR",
        defaultTimezone: "Europe/Berlin",
        locale: "de-DE",
      },
    });
  });

  it("merges partial settings updates", async () => {
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository, {
      defaultCurrency: "GBP",
      defaultTimezone: "Europe/London",
      locale: "en-GB",
    });

    const store = await module.storeAdministrationService.updateStoreSettings(
      TEST_STORE_A_ID,
      validUpdateStoreSettingsInput({ defaultCurrency: "CAD" }),
    );

    expect(store.settings).toEqual({
      defaultCurrency: "CAD",
      defaultTimezone: "Europe/London",
      locale: "en-GB",
    });
  });

  it("rejects duplicate slug updates within the same organization", async () => {
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository, {
      id: TEST_STORE_A_ID,
      slug: "main-store",
    });
    seedStore(module.storeAdministrationRepository, {
      id: TEST_STORE_B_ID,
      slug: "other-store",
    });

    await expect(
      module.storeAdministrationService.updateStoreSettings(TEST_STORE_A_ID, {
        slug: "other-store",
      }),
    ).rejects.toMatchObject({
      code: STORE_ADMINISTRATION_ERROR_CODES.SLUG_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows the same slug when unchanged", async () => {
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository, { slug: "main-store" });

    const store = await module.storeAdministrationService.updateStoreSettings(
      TEST_STORE_A_ID,
      { slug: "main-store", name: "Renamed Store" },
    );

    expect(store.name).toBe("Renamed Store");
    expect(store.slug).toBe("main-store");
  });

  it("returns not found for unknown stores", async () => {
    const module = createMemoryStoreAdministrationModule();

    await expect(
      module.storeAdministrationService.getStoreSettings(TEST_STORE_A_ID),
    ).rejects.toMatchObject({
      code: STORE_ADMINISTRATION_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("isolates updates to the requested store", async () => {
    const module = createMemoryStoreAdministrationModule();
    seedStore(module.storeAdministrationRepository, {
      id: TEST_STORE_A_ID,
      name: "Store A",
    });
    seedStore(module.storeAdministrationRepository, {
      id: TEST_STORE_B_ID,
      name: "Store B",
      slug: "store-b",
    });

    await module.storeAdministrationService.updateStoreSettings(TEST_STORE_A_ID, {
      name: "Updated Store A",
    });

    const storeB = await module.storeAdministrationService.getStoreSettings(
      TEST_STORE_B_ID,
    );

    expect(storeB.name).toBe("Store B");
  });
});

describe("updateStoreSettingsSchema", () => {
  it("rejects empty patch bodies", () => {
    expect(updateStoreSettingsSchema.safeParse({}).success).toBe(false);
  });

  it("rejects invalid currency codes", () => {
    expect(
      updateStoreSettingsSchema.safeParse({ defaultCurrency: "usd" }).success,
    ).toBe(false);
  });

  it("rejects invalid locale formats", () => {
    expect(
      updateStoreSettingsSchema.safeParse({ locale: "EN_us" }).success,
    ).toBe(false);
  });
});
