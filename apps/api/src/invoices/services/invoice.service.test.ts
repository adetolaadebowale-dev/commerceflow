import { describe, expect, it } from "vitest";

import { INVOICE_ERROR_CODES } from "../errors";
import {
  createDraftInvoice,
  createMemoryInvoiceModule,
  seedInvoiceScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validInvoiceInput,
} from "../testing/invoice-test-utils";

describe("InvoiceService", () => {
  it("creates a draft invoice that snapshots order totals", async () => {
    const module = createMemoryInvoiceModule();
    const { order } = await seedInvoiceScenario(module);

    const invoice = await module.invoiceService.createInvoice(
      TEST_STORE_A_ID,
      order.id,
      validInvoiceInput({
        dueAt: "2026-08-01T00:00:00.000Z",
      }),
    );

    expect(invoice.status).toBe("draft");
    expect(invoice.subtotal).toBe(order.subtotal);
    expect(invoice.currency).toBe(order.currency);
    expect(invoice.orderId).toBe(order.id);
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
    expect(invoice.dueAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("rejects a second invoice for the same order", async () => {
    const module = createMemoryInvoiceModule();
    const { order } = await createDraftInvoice(module);

    await expect(
      module.invoiceService.createInvoice(
        TEST_STORE_A_ID,
        order.id,
        validInvoiceInput(),
      ),
    ).rejects.toMatchObject({
      code: INVOICE_ERROR_CODES.ALREADY_EXISTS,
      status: 409,
    });
  });

  it("transitions invoice through issue and paid lifecycle", async () => {
    const module = createMemoryInvoiceModule();
    const { invoice } = await createDraftInvoice(module);

    const issued = await module.invoiceService.issueInvoice(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );
    expect(issued.status).toBe("issued");
    expect(issued.issuedAt).toBeTruthy();

    const paid = await module.invoiceService.markInvoicePaid(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).toBeTruthy();
  });

  it("keeps financial fields immutable after issue", async () => {
    const module = createMemoryInvoiceModule();
    const { order, invoice } = await createDraftInvoice(module);

    const issued = await module.invoiceService.issueInvoice(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );

    expect(issued.subtotal).toBe(order.subtotal);
    expect(issued.currency).toBe(order.currency);
    expect(issued.invoiceNumber).toBe(invoice.invoiceNumber);

    const paid = await module.invoiceService.markInvoicePaid(
      { storeId: TEST_STORE_A_ID },
      invoice.id,
    );

    expect(paid.subtotal).toBe(order.subtotal);
    expect(paid.currency).toBe(order.currency);
    expect(paid.invoiceNumber).toBe(invoice.invoiceNumber);
  });

  it("rejects invalid lifecycle transitions", async () => {
    const module = createMemoryInvoiceModule();
    const { invoice } = await createDraftInvoice(module);

    await expect(
      module.invoiceService.markInvoicePaid(
        { storeId: TEST_STORE_A_ID },
        invoice.id,
      ),
    ).rejects.toMatchObject({
      code: INVOICE_ERROR_CODES.INVALID_TRANSITION,
      status: 409,
    });
  });

  it("generates unique invoice numbers per store", async () => {
    const module = createMemoryInvoiceModule();
    module.invoiceRepository.forceNextInvoiceNumberCollision();

    const first = await createDraftInvoice(module);
    const secondScenario = await seedInvoiceScenario(module);
    const second = await module.invoiceService.createInvoice(
      TEST_STORE_A_ID,
      secondScenario.order.id,
      validInvoiceInput(),
    );

    expect(first.invoice.invoiceNumber).not.toBe(second.invoiceNumber);
  });

  it("isolates invoices by store", async () => {
    const module = createMemoryInvoiceModule();
    const { invoice } = await createDraftInvoice(module);

    await expect(
      module.invoiceService.getInvoice(TEST_STORE_B_ID, invoice.id),
    ).rejects.toMatchObject({
      code: INVOICE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when the transaction fails", async () => {
    const module = createMemoryInvoiceModule();
    const { invoice } = await createDraftInvoice(module);

    module.invoiceRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.invoiceService.issueInvoice(
        { storeId: TEST_STORE_A_ID },
        invoice.id,
      ),
    ).rejects.toMatchObject({
      code: INVOICE_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.invoiceService.getInvoice(
      TEST_STORE_A_ID,
      invoice.id,
    );
    expect(unchanged.status).toBe("draft");
  });
});
