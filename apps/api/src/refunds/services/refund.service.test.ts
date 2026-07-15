import { describe, expect, it } from "vitest";

import { REFUND_ERROR_CODES } from "../errors";
import {
  createMemoryRefundModule,
  createPaidPayment,
  createPendingRefund,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validRefundInput,
} from "../testing/refund-test-utils";
import { createPendingPayment } from "@/payments/testing/payment-test-utils";

describe("RefundService", () => {
  it("creates a full refund derived from the paid payment", async () => {
    const module = createMemoryRefundModule();
    const { payment } = await createPaidPayment(module);

    const refund = await module.refundService.createRefund(
      TEST_STORE_A_ID,
      payment.id,
      validRefundInput({ reason: "Duplicate order" }),
    );

    expect(refund.status).toBe("pending");
    expect(refund.amount).toBe(payment.amount);
    expect(refund.currency).toBe(payment.currency);
    expect(refund.paymentId).toBe(payment.id);
    expect(refund.reason).toBe("Duplicate order");
  });

  it("rejects refund creation for non-paid payments", async () => {
    const module = createMemoryRefundModule();
    const { payment } = await createPendingPayment(module);

    await expect(
      module.refundService.createRefund(
        TEST_STORE_A_ID,
        payment.id,
        validRefundInput(),
      ),
    ).rejects.toMatchObject({
      code: REFUND_ERROR_CODES.PAYMENT_NOT_REFUNDABLE,
      status: 409,
    });
  });

  it("prevents duplicate refunds for the same payment", async () => {
    const module = createMemoryRefundModule();
    const { payment } = await createPaidPayment(module);

    await module.refundService.createRefund(
      TEST_STORE_A_ID,
      payment.id,
      validRefundInput(),
    );

    await expect(
      module.refundService.createRefund(
        TEST_STORE_A_ID,
        payment.id,
        validRefundInput({ reason: "Second attempt" }),
      ),
    ).rejects.toMatchObject({
      code: REFUND_ERROR_CODES.ALREADY_EXISTS,
      status: 409,
    });
  });

  it("transitions refund through complete and cancel lifecycle", async () => {
    const module = createMemoryRefundModule();
    const { refund } = await createPendingRefund(module);

    const completed = await module.refundService.completeRefund(
      { storeId: TEST_STORE_A_ID },
      refund.id,
    );
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeTruthy();

    const moduleForCancel = createMemoryRefundModule();
    const { refund: pendingRefund } = await createPendingRefund(moduleForCancel);

    const cancelled = await moduleForCancel.refundService.cancelRefund(
      { storeId: TEST_STORE_A_ID },
      pendingRefund.id,
    );
    expect(cancelled.status).toBe("cancelled");
  });

  it("rejects invalid lifecycle transitions", async () => {
    const module = createMemoryRefundModule();
    const { refund } = await createPendingRefund(module);

    await module.refundService.cancelRefund(
      { storeId: TEST_STORE_A_ID },
      refund.id,
    );

    await expect(
      module.refundService.completeRefund(
        { storeId: TEST_STORE_A_ID },
        refund.id,
      ),
    ).rejects.toMatchObject({
      code: REFUND_ERROR_CODES.INVALID_TRANSITION,
      status: 409,
    });
  });

  it("keeps completed refunds immutable", async () => {
    const module = createMemoryRefundModule();
    const { refund } = await createPendingRefund(module);

    await module.refundService.completeRefund(
      { storeId: TEST_STORE_A_ID },
      refund.id,
    );

    await expect(
      module.refundService.cancelRefund(
        { storeId: TEST_STORE_A_ID },
        refund.id,
      ),
    ).rejects.toMatchObject({
      code: REFUND_ERROR_CODES.IMMUTABLE,
      status: 409,
    });
  });

  it("isolates refunds by store", async () => {
    const module = createMemoryRefundModule();
    const { refund } = await createPendingRefund(module);

    await expect(
      module.refundService.getRefund(TEST_STORE_B_ID, refund.id),
    ).rejects.toMatchObject({
      code: REFUND_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back when the transaction fails", async () => {
    const module = createMemoryRefundModule();
    const { refund } = await createPendingRefund(module);

    module.refundRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.refundService.completeRefund(
        { storeId: TEST_STORE_A_ID },
        refund.id,
      ),
    ).rejects.toMatchObject({
      code: REFUND_ERROR_CODES.TRANSACTION_FAILED,
      status: 500,
    });

    const unchanged = await module.refundService.getRefund(
      TEST_STORE_A_ID,
      refund.id,
    );
    expect(unchanged.status).toBe("pending");
  });
});
