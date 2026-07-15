import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemorySupplierModule,
  TEST_STORE_A_ID,
  validSupplierInput,
} from "../testing/supplier-test-utils";

describe("SupplierService domain events", () => {
  it("emits supplier.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("supplier.created", handler);

    const module = createMemorySupplierModule({
      domainEventPublisher: publisher,
    });
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "EVENT" }),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "supplier.created",
      aggregateId: supplier.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits supplier contact lifecycle events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const updatedHandler = vi.fn();
    const deletedHandler = vi.fn();
    dispatcher.subscribe("supplier.contact.created", createdHandler);
    dispatcher.subscribe("supplier.contact.updated", updatedHandler);
    dispatcher.subscribe("supplier.contact.deleted", deletedHandler);

    const module = createMemorySupplierModule({
      domainEventPublisher: publisher,
    });
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "CONTACTS" }),
    );

    const contact = await module.supplierService.createContact(supplier.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "Jane",
      lastName: "Doe",
      isPrimary: true,
    });

    await module.supplierService.updateContact(contact.id, {
      storeId: TEST_STORE_A_ID,
      role: "Buyer",
    });

    await module.supplierService.deleteContact(TEST_STORE_A_ID, contact.id);

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(updatedHandler).toHaveBeenCalledOnce();
      expect(deletedHandler).toHaveBeenCalledOnce();
    });
  });
});
