import { describe, expect, it } from "vitest";

import { SUPPLIER_ERROR_CODES } from "../errors";
import {
  createMemorySupplierModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validSupplierInput,
} from "../testing/supplier-test-utils";

describe("SupplierService", () => {
  it("creates a supplier with defaults", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "ACME" }),
    );

    expect(supplier.code).toBe("ACME");
    expect(supplier.status).toBe("active");
    expect(supplier.paymentTerm).toBe("net30");
    expect(supplier.contacts).toEqual([]);
  });

  it("enforces code uniqueness per store", async () => {
    const module = createMemorySupplierModule();
    await module.supplierService.createSupplier(
      validSupplierInput({ code: "SHARED" }),
    );

    await expect(
      module.supplierService.createSupplier(
        validSupplierInput({ code: "SHARED", name: "Duplicate" }),
      ),
    ).rejects.toMatchObject({
      code: SUPPLIER_ERROR_CODES.CODE_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows the same code in different stores", async () => {
    const module = createMemorySupplierModule();
    await module.supplierService.createSupplier(
      validSupplierInput({ code: "SHARED", storeId: TEST_STORE_A_ID }),
    );

    const otherStore = await module.supplierService.createSupplier(
      validSupplierInput({ code: "SHARED", storeId: TEST_STORE_B_ID }),
    );

    expect(otherStore.storeId).toBe(TEST_STORE_B_ID);
  });

  it("updates supplier fields", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "UPD" }),
    );

    const updated = await module.supplierService.updateSupplier(
      TEST_STORE_A_ID,
      supplier.id,
      { name: "Updated Supplier", paymentTerm: "net15" },
    );

    expect(updated.name).toBe("Updated Supplier");
    expect(updated.paymentTerm).toBe("net15");
  });

  it("soft deletes suppliers", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "DEL" }),
    );

    const deleted = await module.supplierService.softDeleteSupplier(
      TEST_STORE_A_ID,
      supplier.id,
    );

    expect(deleted.status).toBe("inactive");

    await expect(
      module.supplierService.getSupplier(TEST_STORE_A_ID, supplier.id),
    ).rejects.toMatchObject({
      code: SUPPLIER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("enforces tenant isolation", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "ISO" }),
    );

    await expect(
      module.supplierService.getSupplier(TEST_STORE_B_ID, supplier.id),
    ).rejects.toMatchObject({
      code: SUPPLIER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("creates and lists contacts", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "CONTACT" }),
    );

    const contact = await module.supplierService.createContact(supplier.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      isPrimary: true,
    });

    expect(contact.isPrimary).toBe(true);

    const refreshed = await module.supplierService.getSupplier(
      TEST_STORE_A_ID,
      supplier.id,
    );
    expect(refreshed.contacts).toHaveLength(1);
    expect(refreshed.contacts[0]?.id).toBe(contact.id);
  });

  it("maintains one primary contact per supplier", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "PRIMARY" }),
    );

    const first = await module.supplierService.createContact(supplier.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "First",
      lastName: "Contact",
      isPrimary: true,
    });

    const second = await module.supplierService.createContact(supplier.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "Second",
      lastName: "Contact",
      isPrimary: true,
    });

    const refreshedFirst = await module.supplierRepository.findContactById(
      TEST_STORE_A_ID,
      first.id,
    );

    expect(second.isPrimary).toBe(true);
    expect(refreshedFirst?.isPrimary).toBe(false);
  });

  it("updates and deletes contacts", async () => {
    const module = createMemorySupplierModule();
    const supplier = await module.supplierService.createSupplier(
      validSupplierInput({ code: "EDIT" }),
    );

    const contact = await module.supplierService.createContact(supplier.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "Old",
      lastName: "Name",
      isPrimary: false,
    });

    const updated = await module.supplierService.updateContact(contact.id, {
      storeId: TEST_STORE_A_ID,
      firstName: "New",
    });

    expect(updated.firstName).toBe("New");

    await module.supplierService.deleteContact(TEST_STORE_A_ID, contact.id);

    const missing = await module.supplierRepository.findContactById(
      TEST_STORE_A_ID,
      contact.id,
    );
    expect(missing).toBeNull();
  });
});
