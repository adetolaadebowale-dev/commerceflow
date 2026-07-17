import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryStoreAdministrationModule,
  seedStore,
  TEST_STORE_A_ID,
} from "../testing/store-administration-test-utils";

describe("StoreAdministrationService domain events", () => {
  it("emits store.settings.updated when settings change", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("store.settings.updated", handler);

    const module = createMemoryStoreAdministrationModule({
      domainEventPublisher: publisher,
    });
    seedStore(module.storeAdministrationRepository);

    const store = await module.storeAdministrationService.updateStoreSettings(
      TEST_STORE_A_ID,
      { defaultCurrency: "EUR" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "store.settings.updated",
      aggregateType: "store",
      aggregateId: TEST_STORE_A_ID,
      storeId: TEST_STORE_A_ID,
      payload: {
        storeId: TEST_STORE_A_ID,
        previousSettings: {
          defaultCurrency: "USD",
          defaultTimezone: "UTC",
          locale: "en-US",
        },
        store: expect.objectContaining({
          id: store.id,
          settings: expect.objectContaining({ defaultCurrency: "EUR" }),
        }),
      },
    });
  });
});
