import { describe, expect, it } from "vitest";

import { seedVariant } from "@/orders/testing/order-test-utils";
import { CART_ERROR_CODES } from "../errors";
import {
  createMemoryCartModule,
  seedCustomerAndVariant,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_VARIANT_A_ID,
  TEST_VARIANT_B_ID,
  validCartInput,
} from "../testing/cart-test-utils";

describe("CartService", () => {
  it("creates one active cart per customer per store", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );

    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );
    expect(cart.status).toBe("active");
    expect(cart.customerId).toBe(customerId);

    await expect(
      cartService.createCart(validCartInput({ customerId })),
    ).rejects.toMatchObject({
      code: CART_ERROR_CODES.ALREADY_ACTIVE,
      status: 409,
    });
  });

  it("merges duplicate variants by increasing quantity", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );
    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );

    await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
    });
    const updated = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 3,
    });

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0]?.quantity).toBe(5);
    expect(updated.items[0]?.lineSubtotal).toBe("99.95");
  });

  it("snapshots price and currency when items are added", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
      { unitPrice: "24.50" },
    );
    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );

    const updated = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
    });

    expect(updated.items[0]?.unitPriceSnapshot).toBe("24.50");
    expect(updated.items[0]?.currencySnapshot).toBe("USD");
    expect(updated.items[0]?.lineSubtotal).toBe("49.00");

    variantSnapshotReader.updateSeededVariant(TEST_VARIANT_A_ID, {
      unitPrice: "99.99",
    });

    const patched = await cartService.updateCartItem(
      TEST_STORE_A_ID,
      updated.items[0]!.id,
      { quantity: 3 },
    );
    expect(patched.items[0]?.unitPriceSnapshot).toBe("24.50");
    expect(patched.items[0]?.lineSubtotal).toBe("73.50");
  });

  it("recalculates cart totals in the service layer", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
      { unitPrice: "10.00" },
    );
    seedVariantSecond(variantSnapshotReader);
    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );

    let updated = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
    });
    updated = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_B_ID,
      quantity: 1,
    });

    expect(updated.subtotal).toBe("35.00");
    expect(updated.currency).toBe("USD");
  });

  it("isolates carts by store", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );
    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );

    await expect(
      cartService.getCart(TEST_STORE_B_ID, cart.id),
    ).rejects.toMatchObject({
      code: CART_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("removes cart items and recalculates totals", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );
    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );
    const withItem = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
    });

    const updated = await cartService.removeCartItem(
      TEST_STORE_A_ID,
      withItem.items[0]!.id,
    );

    expect(updated.items).toHaveLength(0);
    expect(updated.subtotal).toBe("0.00");
  });

  it("rejects mixed-currency cart items", async () => {
    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule();
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
      { currency: "USD" },
    );
    seedVariant(variantSnapshotReader, {
      storeId: TEST_STORE_A_ID,
      productVariantId: TEST_VARIANT_B_ID,
      productName: "Euro Item",
      sku: "EUR-001",
      unitPrice: "15.00",
      currency: "EUR",
    });

    const cart = await cartService.createCart(
      validCartInput({ customerId }),
    );
    await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 1,
    });

    await expect(
      cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
        productVariantId: TEST_VARIANT_B_ID,
        quantity: 1,
      }),
    ).rejects.toMatchObject({
      code: CART_ERROR_CODES.CURRENCY_MISMATCH,
      status: 400,
    });
  });
});

function seedVariantSecond(
  variantSnapshotReader: ReturnType<
    typeof createMemoryCartModule
  >["variantSnapshotReader"],
) {
  seedVariant(variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_B_ID,
    productName: "Hoodie",
    sku: "HD-001",
    unitPrice: "15.00",
    currency: "USD",
  });
}
