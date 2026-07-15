import { describe, expect, it } from "vitest";

import { PAYMENT_ERROR_CODES } from "../errors";
import {
  createMemoryPaymentModule,
  createPendingPayment,
  seedPaymentScenario,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validPaymentInput,
} from "../testing/payment-test-utils";

describe("PaymentService", () => {
  it("creates a pending payment for an order", async () => {
    const module = createMemoryPaymentModule();
    const { order } = await seedPaymentScenario(module);

    const payment = await module.paymentService.createPayment(
      TEST_STORE_A_ID,
      order.id,
      validPaymentInput({ metadata: { channel: "manual" } }),
    );

    expect(payment.status).toBe("pending");
    expect(payment.amount).toBe(order.subtotal);
    expect(payment.currency).toBe(order.currency);
    expect(payment.orderId).toBe(order.id);
    expect(payment.reference).toMatch(/^PAY-/);
    expect(payment.metadata).toEqual({ channel: "manual" });
  });

  it("sets payment amount equal to order subtotal", async () => {
    const module = createMemoryPaymentModule();
    const { order } = await seedPaymentScenario(module);

    const payment = await module.paymentService.createPayment(
      TEST_STORE_A_ID,
      order.id,
      validPaymentInput(),
    );

    expect(payment.amount).toBe("39.98");
    expect(payment.currency).toBe("USD");
  });

  it("transitions payment through authorize and paid lifecycle", async () => {
    const module = createMemoryPaymentModule();
    const { payment } = await createPendingPayment(module);

    const authorized = await module.paymentService.authorizePayment(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );
    expect(authorized.status).toBe("authorized");

    const paid = await module.paymentService.markPaymentPaid(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );
    expect(paid.status).toBe("paid");
  });

  it("rejects invalid lifecycle transitions", async () => {
    const module = createMemoryPaymentModule();
    const { payment } = await createPendingPayment(module);

    await expect(
      module.paymentService.markPaymentPaid(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      ),
    ).rejects.toMatchObject({
      code: PAYMENT_ERROR_CODES.INVALID_TRANSITION,
      status: 409,
    });
  });

  it("rejects transitions from terminal states", async () => {
    const module = createMemoryPaymentModule();
    const { payment } = await createPendingPayment(module);

    await module.paymentService.failPayment(
      { storeId: TEST_STORE_A_ID },
      payment.id,
    );

    await expect(
      module.paymentService.authorizePayment(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      ),
    ).rejects.toMatchObject({
      code: PAYMENT_ERROR_CODES.INVALID_TRANSITION,
      status: 409,
    });
  });

  it("isolates payments by store", async () => {
    const module = createMemoryPaymentModule();
    const { payment } = await createPendingPayment(module);

    await expect(
      module.paymentService.getPayment(TEST_STORE_B_ID, payment.id),
    ).rejects.toMatchObject({
      code: PAYMENT_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("lists payments for an order", async () => {
    const module = createMemoryPaymentModule();
    const { order, payment } = await createPendingPayment(module);

    const payments = await module.paymentService.listOrderPayments(
      { storeId: TEST_STORE_A_ID },
      order.id,
    );

    expect(payments).toHaveLength(1);
    expect(payments[0]?.id).toBe(payment.id);
  });

  it("rolls back when the transaction fails", async () => {
    const module = createMemoryPaymentModule();
    const { payment } = await createPendingPayment(module);

    module.paymentRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.paymentService.authorizePayment(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      ),
    ).rejects.toMatchObject({
      code: PAYMENT_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.paymentService.getPayment(
      TEST_STORE_A_ID,
      payment.id,
    );
    expect(unchanged.status).toBe("pending");
  });
});
