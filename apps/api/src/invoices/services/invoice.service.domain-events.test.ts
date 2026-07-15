import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createDraftInvoice,
  createMemoryInvoiceModule,
  TEST_STORE_A_ID,
} from "../testing/invoice-test-utils";

describe("InvoiceService domain events", () => {
  it("emits invoice.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("invoice.created", handler);

    const module = createMemoryInvoiceModule({ domainEventPublisher: publisher });
    const { invoice } = await createDraftInvoice(module);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "invoice.created",
      aggregateId: invoice.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits invoice.issued and invoice.paid during lifecycle", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const issuedHandler = vi.fn();
    const paidHandler = vi.fn();
    dispatcher.subscribe("invoice.issued", issuedHandler);
    dispatcher.subscribe("invoice.paid", paidHandler);

    const module = createMemoryInvoiceModule({ domainEventPublisher: publisher });
    const { invoice } = await createDraftInvoice(module);

    await module.invoiceService.issueInvoice(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );
    await module.invoiceService.markInvoicePaid(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );

    await vi.waitFor(() => {
      expect(issuedHandler).toHaveBeenCalledOnce();
      expect(paidHandler).toHaveBeenCalledOnce();
    });
  });

  it("does not emit events when transition fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("invoice.paid", handler);

    const module = createMemoryInvoiceModule({ domainEventPublisher: publisher });
    const { invoice } = await createDraftInvoice(module);

    await expect(
      module.invoiceService.markInvoicePaid(
        { storeId: TEST_STORE_A_ID },
        invoice.id,
      ),
    ).rejects.toMatchObject({ status: 409 });

    expect(handler).not.toHaveBeenCalled();
  });
});
