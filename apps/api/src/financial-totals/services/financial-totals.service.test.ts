import { describe, expect, it } from "vitest";

import { PAYMENT_ERROR_CODES } from "@/payments/errors";
import { INVOICE_ERROR_CODES } from "@/invoices/errors";
import { REFUND_ERROR_CODES } from "@/refunds/errors";
import {
  checkoutWithFixedPromotion,
  checkoutWithPercentagePromotion,
  createFinancialTotalsModule,
  seedDiscountedOrder,
  seedZeroDiscountOrder,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  validInvoiceInput,
  validPaymentInput,
  validRefundInput,
} from "../testing/financial-totals-test-utils";
import {
  seedCartWithItem,
  validActivePromotionInput,
} from "@/promotion-redemption/testing/promotion-redemption-test-utils";

describe("Financial totals alignment", () => {
  describe("zero-discount orders", () => {
    it("creates payment amount equal to order total", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedZeroDiscountOrder(module);

      const payment = await module.paymentService.createPayment(
        TEST_STORE_A_ID,
        order.id,
        validPaymentInput(),
      );

      expect(order.subtotal).toBe("39.98");
      expect(order.total).toBe("39.98");
      expect(order.discountAmount).toBeUndefined();
      expect(payment.amount).toBe(order.total);
      expect(payment.amount).toBe("39.98");
    });

    it("snapshots invoice subtotal, discount, and total from order", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedZeroDiscountOrder(module);

      const invoice = await module.invoiceService.createInvoice(
        TEST_STORE_A_ID,
        order.id,
        validInvoiceInput(),
      );

      expect(invoice.subtotal).toBe(order.subtotal);
      expect(invoice.discountAmount).toBeUndefined();
      expect(invoice.total).toBe(order.total);
    });
  });

  describe("discounted orders", () => {
    it("uses order total for payment amount on percentage discount", async () => {
      const module = createFinancialTotalsModule();
      const { order } = await checkoutWithPercentagePromotion(
        module,
        "PCT20",
        "20",
      );

      expect(order.subtotal).toBe("100.00");
      expect(order.discountAmount).toBe("20.00");
      expect(order.total).toBe("80.00");

      const payment = await module.paymentService.createPayment(
        TEST_STORE_A_ID,
        order.id,
        validPaymentInput(),
      );

      expect(payment.amount).toBe("80.00");
      expect(payment.amount).toBe(order.total);
      expect(payment.amount).not.toBe(order.subtotal);
    });

    it("uses order total for payment amount on fixed discount", async () => {
      const module = createFinancialTotalsModule();
      const { order } = await checkoutWithFixedPromotion(
        module,
        "FIXED15",
        "15",
      );

      expect(order.subtotal).toBe("100.00");
      expect(order.discountAmount).toBe("15");
      expect(order.total).toBe("85.00");

      const payment = await module.paymentService.createPayment(
        TEST_STORE_A_ID,
        order.id,
        validPaymentInput(),
      );

      expect(payment.amount).toBe("85.00");
    });

    it("snapshots invoice subtotal, discount, and total from discounted order", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedDiscountedOrder(module, {
        discountAmount: "10.00",
        total: "29.98",
      });

      const invoice = await module.invoiceService.createInvoice(
        TEST_STORE_A_ID,
        order.id,
        validInvoiceInput(),
      );

      expect(invoice.subtotal).toBe("39.98");
      expect(invoice.discountAmount).toBe("10.00");
      expect(invoice.total).toBe("29.98");
    });

    it("keeps invoice totals immutable after promotion definition changes", async () => {
      const module = createFinancialTotalsModule();
      const { address, cart } = await seedCartWithItem(module);
      const promotion = await module.promotionRepository.create(
        validActivePromotionInput({ code: "HISTORIC10", value: "10" }),
      );

      await module.promotionRedemptionService.applyPromotion(
        TEST_STORE_A_ID,
        cart.id,
        { code: "HISTORIC10" },
      );

      const checkout = await module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        { customerAddressId: address.id },
      );
      module.orderRepository.seedOrder(checkout.order);

      const invoice = await module.invoiceService.createInvoice(
        TEST_STORE_A_ID,
        checkout.order.id,
        validInvoiceInput(),
      );

      await module.promotionRepository.update(TEST_STORE_A_ID, promotion.id, {
        value: "50",
      });

      const unchanged = await module.invoiceService.getInvoice(
        TEST_STORE_A_ID,
        invoice.id,
      );

      expect(unchanged.subtotal).toBe("100.00");
      expect(unchanged.discountAmount).toBe("10.00");
      expect(unchanged.total).toBe("90.00");
    });
  });

  describe("refunds", () => {
    it("snapshots refund amount from payment amount", async () => {
      const module = createFinancialTotalsModule();
      const { order } = await checkoutWithFixedPromotion(
        module,
        "REFUND15",
        "15",
      );

      const payment = await module.paymentService.createPayment(
        TEST_STORE_A_ID,
        order.id,
        validPaymentInput(),
      );
      await module.paymentService.authorizePayment(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      );
      await module.paymentService.markPaymentPaid(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      );

      const refund = await module.refundService.createRefund(
        TEST_STORE_A_ID,
        payment.id,
        validRefundInput({ reason: "Customer return" }),
      );

      expect(refund.amount).toBe(payment.amount);
      expect(refund.amount).toBe("85.00");
    });
  });

  describe("checkout recalculation", () => {
    it("derives totals from line items rather than persisted cart totals", async () => {
      const module = createFinancialTotalsModule();
      const { address, cart } = await seedCartWithItem(module);

      await module.promotionRepository.create(
        validActivePromotionInput({ code: "NOCART", value: "10" }),
      );

      await module.promotionRedemptionService.applyPromotion(
        TEST_STORE_A_ID,
        cart.id,
        { code: "NOCART" },
      );

      const staleCart = {
        ...cart,
        subtotal: "999.99",
        discountAmount: "999.99",
        total: "0.00",
      };
      module.checkoutRepository.seedCart(staleCart);

      const result = await module.checkoutService.checkoutCart(
        TEST_STORE_A_ID,
        cart.id,
        { customerAddressId: address.id },
      );

      expect(result.order.subtotal).toBe("100.00");
      expect(result.order.discountAmount).toBe("10.00");
      expect(result.order.total).toBe("90.00");
    });
  });

  describe("tenant isolation", () => {
    it("rejects payment creation for orders in another store", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedZeroDiscountOrder(module);

      await expect(
        module.paymentService.createPayment(
          TEST_STORE_B_ID,
          order.id,
          validPaymentInput(),
        ),
      ).rejects.toMatchObject({
        code: PAYMENT_ERROR_CODES.ORDER_NOT_FOUND,
        status: 404,
      });
    });

    it("rejects invoice creation for orders in another store", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedZeroDiscountOrder(module);

      await expect(
        module.invoiceService.createInvoice(
          TEST_STORE_B_ID,
          order.id,
          validInvoiceInput(),
        ),
      ).rejects.toMatchObject({
        code: INVOICE_ERROR_CODES.ORDER_NOT_FOUND,
        status: 404,
      });
    });
  });

  describe("rollback", () => {
    it("rolls back payment authorization without changing amount", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedDiscountedOrder(module, {
        discountAmount: "5.00",
        total: "34.98",
      });

      const payment = await module.paymentService.createPayment(
        TEST_STORE_A_ID,
        order.id,
        validPaymentInput(),
      );

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
      expect(unchanged.amount).toBe("34.98");
      expect(unchanged.status).toBe("pending");
    });

    it("rolls back invoice issue without changing financial snapshots", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedDiscountedOrder(module, {
        discountAmount: "5.00",
        total: "34.98",
      });

      const invoice = await module.invoiceService.createInvoice(
        TEST_STORE_A_ID,
        order.id,
        validInvoiceInput(),
      );

      module.invoiceRepository.setTransactionFailure(new Error("db failure"));

      await expect(
        module.invoiceService.issueInvoice(
          { storeId: TEST_STORE_A_ID },
          invoice.id,
        ),
      ).rejects.toMatchObject({
        code: INVOICE_ERROR_CODES.TRANSACTION_FAILED,
        status: 500,
      });

      const unchanged = await module.invoiceService.getInvoice(
        TEST_STORE_A_ID,
        invoice.id,
      );
      expect(unchanged.subtotal).toBe("39.98");
      expect(unchanged.discountAmount).toBe("5.00");
      expect(unchanged.total).toBe("34.98");
      expect(unchanged.status).toBe("draft");
    });

    it("rolls back refund completion without changing amount", async () => {
      const module = createFinancialTotalsModule();
      const order = await seedDiscountedOrder(module, {
        discountAmount: "5.00",
        total: "34.98",
      });

      const payment = await module.paymentService.createPayment(
        TEST_STORE_A_ID,
        order.id,
        validPaymentInput(),
      );
      await module.paymentService.authorizePayment(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      );
      await module.paymentService.markPaymentPaid(
        { storeId: TEST_STORE_A_ID },
        payment.id,
      );

      const refund = await module.refundService.createRefund(
        TEST_STORE_A_ID,
        payment.id,
        validRefundInput(),
      );

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
      expect(unchanged.amount).toBe("34.98");
      expect(unchanged.status).toBe("pending");
    });
  });
});
