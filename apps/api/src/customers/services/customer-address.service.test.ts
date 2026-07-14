import { describe, expect, it } from "vitest";

import { CUSTOMER_ERROR_CODES } from "../errors";
import {
  createMemoryCustomerAddressService,
  createMemoryCustomerModule,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCustomerAddressInput,
  validCustomerInput,
} from "../testing/customer-test-utils";

describe("CustomerAddressService", () => {
  it("creates multiple addresses for a customer", async () => {
    const { customerService, customerAddressService } =
      createMemoryCustomerModule();

    const customer = await customerService.createCustomer(validCustomerInput());
    const home = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput({ label: "Home" }),
    );
    const work = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput({
        label: "Work",
        addressLine1: "456 Office Blvd",
      }),
    );

    const addresses = await customerAddressService.listCustomerAddresses(
      TEST_STORE_A_ID,
      customer.id,
    );

    expect(addresses).toHaveLength(2);
    expect(addresses.map((address) => address.label)).toEqual(
      expect.arrayContaining(["Home", "Work"]),
    );
    expect(home.isDefault).toBe(true);
    expect(work.isDefault).toBe(false);
  });

  it("switches the default address when a new default is set", async () => {
    const { customerService, customerAddressService } =
      createMemoryCustomerModule();

    const customer = await customerService.createCustomer(validCustomerInput());
    const home = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput({ label: "Home", isDefault: true }),
    );
    const work = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput({
        label: "Work",
        addressLine1: "456 Office Blvd",
      }),
    );

    const updatedWork = await customerAddressService.updateCustomerAddress(
      TEST_STORE_A_ID,
      work.id,
      { isDefault: true },
    );
    const refreshedHome = await customerAddressService.getCustomerAddress(
      TEST_STORE_A_ID,
      home.id,
    );

    expect(updatedWork.isDefault).toBe(true);
    expect(refreshedHome.isDefault).toBe(false);
  });

  it("isolates customer addresses by store", async () => {
    const { customerService, customerAddressService } =
      createMemoryCustomerModule();

    const customer = await customerService.createCustomer(validCustomerInput());
    const address = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput(),
    );

    await expect(
      customerAddressService.getCustomerAddress(TEST_STORE_B_ID, address.id),
    ).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.CUSTOMER_ADDRESS_NOT_FOUND,
      status: 404,
    });
  });

  it("soft deletes an address and excludes it from listing", async () => {
    const { customerService, customerAddressService } =
      createMemoryCustomerModule();

    const customer = await customerService.createCustomer(validCustomerInput());
    const address = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput(),
    );

    await customerAddressService.deleteCustomerAddress(
      TEST_STORE_A_ID,
      address.id,
    );

    await expect(
      customerAddressService.getCustomerAddress(TEST_STORE_A_ID, address.id),
    ).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.CUSTOMER_ADDRESS_NOT_FOUND,
      status: 404,
    });

    const addresses = await customerAddressService.listCustomerAddresses(
      TEST_STORE_A_ID,
      customer.id,
    );
    expect(addresses).toHaveLength(0);
  });

  it("promotes another address to default when the default is soft deleted", async () => {
    const { customerService, customerAddressService } =
      createMemoryCustomerModule();

    const customer = await customerService.createCustomer(validCustomerInput());
    const home = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput({ label: "Home", isDefault: true }),
    );
    const work = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput({
        label: "Work",
        addressLine1: "456 Office Blvd",
      }),
    );

    await customerAddressService.deleteCustomerAddress(TEST_STORE_A_ID, home.id);

    const remaining = await customerAddressService.getCustomerAddress(
      TEST_STORE_A_ID,
      work.id,
    );
    expect(remaining.isDefault).toBe(true);
  });

  it("rejects address operations for a missing customer", async () => {
    const { customerAddressService } = createMemoryCustomerAddressService();

    await expect(
      customerAddressService.createCustomerAddress(
        TEST_STORE_A_ID,
        "00000000-0000-0000-0000-000000000000",
        validCustomerAddressInput(),
      ),
    ).rejects.toMatchObject({
      code: CUSTOMER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});
