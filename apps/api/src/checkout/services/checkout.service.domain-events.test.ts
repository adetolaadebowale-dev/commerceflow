import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryCheckoutModule,
  seedCheckoutScenario,
  TEST_STORE_A_ID,
  validCheckoutInput,
} from "../testing/checkout-test-utils";

describe("CheckoutService domain events", () => {
  it("emits checkout.completed after successful checkout", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("checkout.completed", handler);

    const module = createMemoryCheckoutModule({
      domainEventPublisher: publisher,
    });
    const { address, cart } = await seedCheckoutScenario(module);

    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      validCheckoutInput({ customerAddressId: address.id }),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "checkout.completed",
      aggregateId: result.order.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        cartId: cart.id,
        orderId: result.order.id,
      },
    });
  });

  it("does not emit events when checkout fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("checkout.completed", handler);

    const module = createMemoryCheckoutModule({
      domainEventPublisher: publisher,
    });
    const { address, cart } = await seedCheckoutScenario(module);
    module.checkoutRepository.setTransactionFailure(new Error("fail"));

    await expect(
      module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        validCheckoutInput({ customerAddressId: address.id }),
      ),
    ).rejects.toMatchObject({
      status: 500,
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
