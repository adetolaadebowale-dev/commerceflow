import { describe, expect, it } from "vitest";

import { CUSTOMER_ERROR_CODES } from "../errors";
import {
  createMemoryCustomerService,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCustomerInput,
} from "../testing/customer-test-utils";

describe("CustomerService", () => {
  it("creates, lists, gets, and updates a customer", async () => {
    const { customerService } = createMemoryCustomerService();
    const input = validCustomerInput();

    const created = await customerService.createCustomer(input);
    expect(created.email).toBe(input.email.trim().toLowerCase());
    expect(created.storeId).toBe(TEST_STORE_A_ID);

    const listed = await customerService.listCustomers({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);

    const fetched = await customerService.getCustomer(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(fetched.firstName).toBe(input.firstName);

    const updated = await customerService.updateCustomer(
      TEST_STORE_A_ID,
      created.id,
      { firstName: "Janet" },
    );
    expect(updated.firstName).toBe("Janet");
  });

  it("rejects duplicate customer emails within the same store", async () => {
    const { customerService } = createMemoryCustomerService();
    const input = validCustomerInput({ email: "duplicate@example.com" });

    await customerService.createCustomer(input);

    await expect(customerService.createCustomer(input)).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      status: 409,
    });
  });

  it("allows duplicate emails across different stores", async () => {
    const { customerService } = createMemoryCustomerService();
    const email = "shared@example.com";

    await customerService.createCustomer(
      validCustomerInput({ storeId: TEST_STORE_A_ID, email }),
    );

    const created = await customerService.createCustomer(
      validCustomerInput({ storeId: TEST_STORE_B_ID, email }),
    );

    expect(created.email).toBe(email);
  });

  it("soft deletes a customer and excludes it from queries", async () => {
    const { customerService } = createMemoryCustomerService();
    const created = await customerService.createCustomer(validCustomerInput());

    const deleted = await customerService.deleteCustomer(
      TEST_STORE_A_ID,
      created.id,
    );
    expect(deleted.id).toBe(created.id);

    await expect(
      customerService.getCustomer(TEST_STORE_A_ID, created.id),
    ).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });

    const listed = await customerService.listCustomers({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(0);
  });

  it("isolates customers by store", async () => {
    const { customerService } = createMemoryCustomerService();
    const customer = await customerService.createCustomer(validCustomerInput());

    await expect(
      customerService.getCustomer(TEST_STORE_B_ID, customer.id),
    ).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("allows reusing an email after soft delete", async () => {
    const { customerService } = createMemoryCustomerService();
    const email = "reusable@example.com";
    const created = await customerService.createCustomer(
      validCustomerInput({ email }),
    );

    await customerService.deleteCustomer(TEST_STORE_A_ID, created.id);

    const recreated = await customerService.createCustomer(
      validCustomerInput({ email }),
    );
    expect(recreated.email).toBe(email);
  });

  it("rejects duplicate email on update", async () => {
    const { customerService } = createMemoryCustomerService();
    const first = await customerService.createCustomer(
      validCustomerInput({ email: "first@example.com" }),
    );
    const second = await customerService.createCustomer(
      validCustomerInput({ email: "second@example.com" }),
    );

    await expect(
      customerService.updateCustomer(TEST_STORE_A_ID, second.id, {
        email: first.email,
      }),
    ).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.EMAIL_ALREADY_EXISTS,
      status: 409,
    });
  });
});
