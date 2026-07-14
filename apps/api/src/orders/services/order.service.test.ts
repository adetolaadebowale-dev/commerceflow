import { describe, expect, it } from "vitest";

import { ORDER_ERROR_CODES } from "../errors";
import {
  createDraftOrder,
  createMemoryOrderService,
  seedVariant,
  TEST_CUSTOMER_ID,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_VARIANT_A_ID,
  TEST_VARIANT_B_ID,
  validOrderInput,
} from "../testing/order-test-utils";

function seedDefaultVariants(
  variantSnapshotReader: ReturnType<
    typeof createMemoryOrderService
  >["variantSnapshotReader"],
): void {
  seedVariant(variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_A_ID,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: "19.99",
    currency: "USD",
  });
  seedVariant(variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_B_ID,
    productName: "Classic Hoodie",
    sku: "HD-001",
    unitPrice: "39.50",
    currency: "USD",
  });
}

describe("OrderService", () => {
  it("creates an order with calculated totals and snapshots", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    const order = await orderService.createOrder(
      validOrderInput({
        customerId: TEST_CUSTOMER_ID,
        items: [{ productVariantId: TEST_VARIANT_A_ID, quantity: 2 }],
      }),
    );

    expect(order.storeId).toBe(TEST_STORE_A_ID);
    expect(order.customerId).toBe(TEST_CUSTOMER_ID);
    expect(order.status).toBe("draft");
    expect(order.currency).toBe("USD");
    expect(order.orderNumber).toMatch(/^ORD-/);
    expect(order.subtotal).toBe("39.98");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      productVariantId: TEST_VARIANT_A_ID,
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: "19.99",
      currency: "USD",
      quantity: 2,
      lineSubtotal: "39.98",
    });
  });

  it("merges duplicate line items and calculates subtotal across items", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    const order = await orderService.createOrder(
      validOrderInput({
        items: [
          { productVariantId: TEST_VARIANT_A_ID, quantity: 1 },
          { productVariantId: TEST_VARIANT_A_ID, quantity: 2 },
          { productVariantId: TEST_VARIANT_B_ID, quantity: 1 },
        ],
      }),
    );

    expect(order.items).toHaveLength(2);
    expect(order.subtotal).toBe("99.47");
  });

  it("preserves product snapshots when catalogue data changes", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    const order = await orderService.createOrder(validOrderInput());

    variantSnapshotReader.updateSeededVariant(TEST_VARIANT_A_ID, {
      productName: "Updated Tee",
      sku: "TEE-999",
      unitPrice: "99.99",
      currency: "EUR",
    });

    const fetched = await orderService.getOrder(TEST_STORE_A_ID, order.id);
    expect(fetched.items[0]?.productName).toBe("Classic Tee");
    expect(fetched.items[0]?.sku).toBe("TEE-001");
    expect(fetched.items[0]?.unitPrice).toBe("19.99");
    expect(fetched.items[0]?.currency).toBe("USD");
  });

  it("gets and lists orders", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    const created = await orderService.createOrder(validOrderInput());
    const fetched = await orderService.getOrder(TEST_STORE_A_ID, created.id);
    expect(fetched.id).toBe(created.id);

    const listed = await orderService.listOrders({
      storeId: TEST_STORE_A_ID,
      page: 1,
      limit: 20,
    });
    expect(listed.items).toHaveLength(1);
    expect(listed.totalPages).toBe(1);
  });

  it("rejects orders with unknown product variants", async () => {
    const { orderService } = createMemoryOrderService();

    await expect(
      orderService.createOrder(
        validOrderInput({
          items: [
            { productVariantId: "00000000-0000-0000-0000-000000000099", quantity: 1 },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.VARIANT_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects inactive catalogue variants", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedVariant(variantSnapshotReader, {
      storeId: TEST_STORE_A_ID,
      productVariantId: TEST_VARIANT_A_ID,
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: "19.99",
      isActive: false,
    });

    await expect(orderService.createOrder(validOrderInput())).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.VARIANT_NOT_FOUND,
      status: 404,
    });
  });

  it("rejects orders with mixed currencies", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedVariant(variantSnapshotReader, {
      storeId: TEST_STORE_A_ID,
      productVariantId: TEST_VARIANT_A_ID,
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: "19.99",
      currency: "USD",
    });
    seedVariant(variantSnapshotReader, {
      storeId: TEST_STORE_A_ID,
      productVariantId: TEST_VARIANT_B_ID,
      productName: "Classic Hoodie",
      sku: "HD-001",
      unitPrice: "39.50",
      currency: "EUR",
    });

    await expect(
      orderService.createOrder(
        validOrderInput({
          items: [
            { productVariantId: TEST_VARIANT_A_ID, quantity: 1 },
            { productVariantId: TEST_VARIANT_B_ID, quantity: 1 },
          ],
        }),
      ),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.CURRENCY_MISMATCH,
      status: 400,
    });
  });

  it("isolates orders by store", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    const order = await orderService.createOrder(validOrderInput());

    await expect(
      orderService.getOrder(TEST_STORE_B_ID, order.id),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("paginates order lists", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    for (let index = 0; index < 5; index += 1) {
      await orderService.createOrder(validOrderInput());
    }

    const pageTwo = await orderService.listOrders({
      storeId: TEST_STORE_A_ID,
      page: 2,
      limit: 2,
    });

    expect(pageTwo.items).toHaveLength(2);
    expect(pageTwo.total).toBe(5);
    expect(pageTwo.totalPages).toBe(3);
  });

  it("filters orders by status", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    await orderService.createOrder(validOrderInput({ status: "draft" }));
    await orderService.createOrder(validOrderInput({ status: "confirmed" }));

    const listed = await orderService.listOrders({
      storeId: TEST_STORE_A_ID,
      status: "confirmed",
      page: 1,
      limit: 20,
    });

    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.status).toBe("confirmed");
  });

  it("does not persist orders when creation fails", async () => {
    const { orderService, orderRepository, variantSnapshotReader } =
      createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);
    orderRepository.setTransactionFailure(
      new Error("simulated transaction failure"),
    );

    await expect(orderService.createOrder(validOrderInput())).rejects.toThrow(
      "simulated transaction failure",
    );

    expect(orderRepository.getOrderCount()).toBe(0);
  });

  it("retries order number generation when a duplicate is detected", async () => {
    const { orderService, orderRepository, variantSnapshotReader } =
      createMemoryOrderService();
    seedDefaultVariants(variantSnapshotReader);

    await orderService.createOrder(validOrderInput());
    orderRepository.forceNextOrderNumberCollision();

    const second = await orderService.createOrder(validOrderInput());
    expect(second.orderNumber).toMatch(/^ORD-/);
    expect(orderRepository.getOrderCount()).toBe(2);
  });
});

describe("OrderService lifecycle", () => {
  it("confirms a draft order and sets confirmedAt", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);

    expect(draft.confirmedAt).toBeUndefined();
    expect(draft.cancelledAt).toBeUndefined();

    const confirmed = await orderService.confirmOrder(
      { storeId: TEST_STORE_A_ID },
      draft.id,
    );

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.confirmedAt).toBeDefined();
    expect(confirmed.cancelledAt).toBeUndefined();
    expect(confirmed.createdAt).toBe(draft.createdAt);
    expect(confirmed.items[0]?.createdAt).toBe(draft.items[0]?.createdAt);
    expect(confirmed.subtotal).toBe(draft.subtotal);
  });

  it("cancels a draft order and sets cancelledAt", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);

    const cancelled = await orderService.cancelOrder(
      { storeId: TEST_STORE_A_ID },
      draft.id,
    );

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelledAt).toBeDefined();
    expect(cancelled.confirmedAt).toBeUndefined();
    expect(cancelled.createdAt).toBe(draft.createdAt);
  });

  it("cancels a confirmed order while preserving confirmedAt", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);
    const confirmed = await orderService.confirmOrder(
      { storeId: TEST_STORE_A_ID },
      draft.id,
    );

    const cancelled = await orderService.cancelOrder(
      { storeId: TEST_STORE_A_ID },
      confirmed.id,
    );

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.confirmedAt).toBe(confirmed.confirmedAt);
    expect(cancelled.cancelledAt).toBeDefined();
  });

  it("rejects confirming a non-draft order", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);
    await orderService.confirmOrder({ storeId: TEST_STORE_A_ID }, draft.id);

    await expect(
      orderService.confirmOrder({ storeId: TEST_STORE_A_ID }, draft.id),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.IMMUTABLE,
      status: 409,
    });
  });

  it("rejects cancelling an already cancelled order", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);
    await orderService.cancelOrder({ storeId: TEST_STORE_A_ID }, draft.id);

    await expect(
      orderService.cancelOrder({ storeId: TEST_STORE_A_ID }, draft.id),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.IMMUTABLE,
      status: 409,
    });
  });

  it("rejects confirming a cancelled order", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);
    await orderService.cancelOrder({ storeId: TEST_STORE_A_ID }, draft.id);

    await expect(
      orderService.confirmOrder({ storeId: TEST_STORE_A_ID }, draft.id),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.IMMUTABLE,
      status: 409,
    });
  });

  it("isolates lifecycle actions by store", async () => {
    const { orderService, variantSnapshotReader } = createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);

    await expect(
      orderService.confirmOrder({ storeId: TEST_STORE_B_ID }, draft.id),
    ).rejects.toMatchObject({
      code: ORDER_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("does not persist lifecycle changes when transition fails", async () => {
    const { orderService, orderRepository, variantSnapshotReader } =
      createMemoryOrderService();
    const draft = await createDraftOrder(orderService, variantSnapshotReader);

    orderRepository.setTransactionFailure(
      new Error("simulated transition failure"),
    );

    await expect(
      orderService.confirmOrder({ storeId: TEST_STORE_A_ID }, draft.id),
    ).rejects.toThrow("simulated transition failure");

    const unchanged = await orderService.getOrder(TEST_STORE_A_ID, draft.id);
    expect(unchanged.status).toBe("draft");
    expect(unchanged.confirmedAt).toBeUndefined();
  });
});

describe("order pricing", () => {
  it("calculates line and order subtotals using decimal-safe math", async () => {
    const { multiplyPrice, sumPrices } = await import("../services/order-pricing");

    expect(multiplyPrice("19.99", 2)).toBe("39.98");
    expect(sumPrices(["19.99", "39.50"])).toBe("59.49");
  });
});
