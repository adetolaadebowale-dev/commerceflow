import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryTaxRateModule,
  TEST_STORE_A_ID,
  validTaxRateInput,
} from "../testing/tax-rate-test-utils";

describe("TaxRateService domain events", () => {
  it("emits tax.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("tax.created", handler);

    const module = createMemoryTaxRateModule({ domainEventPublisher: publisher });
    const taxRate = await module.taxRateService.createTaxRate(validTaxRateInput());

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "tax.created",
      aggregateId: taxRate.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits tax.activated and tax.deactivated during lifecycle", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const activatedHandler = vi.fn();
    const deactivatedHandler = vi.fn();
    dispatcher.subscribe("tax.activated", activatedHandler);
    dispatcher.subscribe("tax.deactivated", deactivatedHandler);

    const module = createMemoryTaxRateModule({ domainEventPublisher: publisher });
    const taxRate = await module.taxRateService.createTaxRate(validTaxRateInput());

    await module.taxRateService.activateTaxRate(TEST_STORE_A_ID, taxRate.id);
    await module.taxRateService.deactivateTaxRate(TEST_STORE_A_ID, taxRate.id);

    await vi.waitFor(() => {
      expect(activatedHandler).toHaveBeenCalledOnce();
      expect(deactivatedHandler).toHaveBeenCalledOnce();
    });
  });
});
