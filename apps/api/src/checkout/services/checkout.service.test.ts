import { describe, expect, it } from "vitest";

import { validCustomerInput } from "@/customers/testing/customer-test-utils";
import { CHECKOUT_ERROR_CODES } from "../errors";
import {
  createMemoryCheckoutModule,
  seedCheckoutScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validCheckoutInput,
} from "../testing/checkout-test-utils";

describe("CheckoutService", () => {
  it("converts an active cart into a draft order with address snapshot", async () => {
    const module = createMemoryCheckoutModule();
    const { address, cart } = await seedCheckoutScenario(module);

    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      validCheckoutInput({ customerAddressId: address.id }),
    );

    expect(result.cart.status).toBe("converted");
    expect(result.order.status).toBe("draft");
    expect(result.order.customerProfileId).toBe(cart.customerId);
    expect(result.order.sourceCartId).toBe(cart.id);
    expect(result.order.items).toHaveLength(1);
    expect(result.order.items[0]?.unitPrice).toBe("19.99");
    expect(result.order.items[0]?.lineSubtotal).toBe("39.98");
    expect(result.order.subtotal).toBe("39.98");
    expect(result.order.total).toBe("39.98");
    expect(result.order.shippingAddress).toMatchObject({
      recipientName: address.recipientName,
      addressLine1: address.addressLine1,
      city: address.city,
      countryCode: address.countryCode,
    });
  });

  it("rejects checkout for an empty cart", async () => {
    const module = createMemoryCheckoutModule();
    const customer = await module.customerRepository.create(
      validCustomerInput({
        email: `empty-cart-${crypto.randomUUID().slice(0, 8)}@example.com`,
      }),
    );
    const address = await module.customerAddressRepository.create({
      label: "Home",
      recipientName: "Jane Doe",
      addressLine1: "123 Main St",
      city: "Springfield",
      stateProvince: "IL",
      postalCode: "62704",
      countryCode: "US",
      isDefault: true,
      storeId: TEST_STORE_A_ID,
      customerId: customer.id,
    });
    const cart = await module.cartRepository.create({
      storeId: TEST_STORE_A_ID,
      customerId: customer.id,
    });
    module.checkoutRepository.seedCart(cart);

    await expect(
      module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        validCheckoutInput({ customerAddressId: address.id }),
      ),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.EMPTY_CART,
      status: 400,
    });
  });

  it("recalculates order totals instead of trusting cart subtotal", async () => {
    const module = createMemoryCheckoutModule();
    const { address, cart } = await seedCheckoutScenario(module);

    const tamperedCart = {
      ...cart,
      subtotal: "1.00",
    };
    module.checkoutRepository.seedCart(tamperedCart);

    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      validCheckoutInput({ customerAddressId: address.id }),
    );

    expect(result.order.subtotal).toBe("39.98");
    expect(result.order.total).toBe("39.98");
    expect(result.order.subtotal).not.toBe("1.00");
  });

  it("isolates checkout by store", async () => {
    const module = createMemoryCheckoutModule();
    const { address, cart } = await seedCheckoutScenario(module);

    await expect(
      module.checkoutService.checkoutCart(
        TEST_STORE_B_ID,
        cart.id,
        validCheckoutInput({ customerAddressId: address.id }),
      ),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.CART_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects checkout when address does not belong to customer", async () => {
    const module = createMemoryCheckoutModule();
    const { cart } = await seedCheckoutScenario(module);
    const otherCustomer = await module.customerRepository.create(
      validCustomerInput({
        email: `other-${crypto.randomUUID().slice(0, 8)}@example.com`,
      }),
    );
    const otherAddress = await module.customerAddressRepository.create({
      label: "Work",
      recipientName: "Other Person",
      addressLine1: "999 Other St",
      city: "Chicago",
      stateProvince: "IL",
      postalCode: "60601",
      countryCode: "US",
      isDefault: true,
      storeId: TEST_STORE_A_ID,
      customerId: otherCustomer.id,
    });

    await expect(
      module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        validCheckoutInput({ customerAddressId: otherAddress.id }),
      ),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.ADDRESS_NOT_OWNED,
      status: 400,
    });
  });

  it("rejects checkout for a converted cart", async () => {
    const module = createMemoryCheckoutModule();
    const { address, cart } = await seedCheckoutScenario(module);

    await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      validCheckoutInput({ customerAddressId: address.id }),
    );

    await expect(
      module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        validCheckoutInput({ customerAddressId: address.id }),
      ),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.CART_NOT_ACTIVE,
      status: 409,
    });
  });

  it("rolls back checkout when the transaction fails", async () => {
    const module = createMemoryCheckoutModule();
    const { address, cart } = await seedCheckoutScenario(module);
    module.checkoutRepository.setTransactionFailure(
      new Error("Checkout transaction failed"),
    );

    await expect(
      module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        validCheckoutInput({ customerAddressId: address.id }),
      ),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const refreshed = await module.cartRepository.findById(
      TEST_STORE_A_ID,
      cart.id,
    );
    expect(refreshed?.status).toBe("active");
  });
});
