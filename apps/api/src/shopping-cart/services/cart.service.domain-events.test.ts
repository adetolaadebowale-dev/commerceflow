import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryCartModule,
  seedCustomerAndVariant,
  TEST_STORE_A_ID,
  TEST_VARIANT_A_ID,
  validCartInput,
} from "../testing/cart-test-utils";

describe("CartService domain events", () => {
  it("emits cart.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("cart.created", handler);

    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule({ domainEventPublisher: publisher });
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );

    const cart = await cartService.createCart(validCartInput({ customerId }));

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "cart.created",
      aggregateId: cart.id,
      storeId: TEST_STORE_A_ID,
    });
  });

  it("emits cart.item.added and cart.item.updated for item mutations", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const addedHandler = vi.fn();
    const updatedHandler = vi.fn();
    dispatcher.subscribe("cart.item.added", addedHandler);
    dispatcher.subscribe("cart.item.updated", updatedHandler);

    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule({ domainEventPublisher: publisher });
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );
    const cart = await cartService.createCart(validCartInput({ customerId }));

    await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 1,
    });

    await vi.waitFor(() => {
      expect(addedHandler).toHaveBeenCalledOnce();
    });

    await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 2,
    });

    await vi.waitFor(() => {
      expect(updatedHandler).toHaveBeenCalledOnce();
    });
  });

  it("emits cart.item.removed after item deletion", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("cart.item.removed", handler);

    const { cartService, customerService, variantSnapshotReader } =
      createMemoryCartModule({ domainEventPublisher: publisher });
    const { customerId } = await seedCustomerAndVariant(
      customerService,
      variantSnapshotReader,
    );
    const cart = await cartService.createCart(validCartInput({ customerId }));
    const withItem = await cartService.addCartItem(TEST_STORE_A_ID, cart.id, {
      productVariantId: TEST_VARIANT_A_ID,
      quantity: 1,
    });

    await cartService.removeCartItem(
      TEST_STORE_A_ID,
      withItem.items[0]!.id,
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("cart.item.removed");
  });
});
