import { describe, expect, it } from "vitest";

import { validPaymentInput } from "@/payments/testing/payment-test-utils";
import { validInvoiceInput } from "@/invoices/testing/invoice-test-utils";
import {
  seedCartWithItem,
  seedEligibleShipping,
  validActivePromotionInput,
} from "@/promotion-redemption/testing/promotion-redemption-test-utils";
import { createMemoryPromotionRedemptionModule } from "@/promotion-redemption/testing/promotion-redemption-test-utils";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { PaymentService } from "@/payments/services/payment.service";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { InvoiceService } from "@/invoices/services/invoice.service";
import { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import { getPaymentGatewayFactory } from "@/payments/gateways";
import { validTaxRateInput } from "@/tax-rates/testing/tax-rate-test-utils";
import { TEST_STORE_A_ID } from "@/orders/testing/order-test-utils";

describe("Tax foundation integration", () => {
  it("calculates checkout totals with tax after discount", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { method: shippingMethod } = await seedEligibleShipping(module);

    const taxRate = await module.taxRateService.createTaxRate(
      validTaxRateInput({ percentage: "10", status: "inactive" }),
    );
    await module.taxRateService.activateTaxRate(TEST_STORE_A_ID, taxRate.id);

    await module.promotionRepository.create(
      validActivePromotionInput({ code: "TAXSAVE", value: "20" }),
    );
    await module.promotionRedemptionService.applyPromotion(
      TEST_STORE_A_ID,
      cart.id,
      { code: "TAXSAVE" },
    );

    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      {
        customerAddressId: address.id,
        shippingMethodId: shippingMethod.id,
      },
    );

    expect(result.order.subtotal).toBe("100.00");
    expect(result.order.discountAmount).toBe("20.00");
    expect(result.order.taxAmount).toBe("8.00");
    expect(result.order.shippingAmount).toBe("9.99");
    expect(result.order.total).toBe("97.99");
    expect(result.order.appliedTaxRate).toMatchObject({
      taxRateId: taxRate.id,
      nameSnapshot: "Standard Sales Tax",
      percentageSnapshot: "10",
    });
  });

  it("snapshots tax on invoice and uses order total for payment", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const orderRepository = new MemoryOrderRepository();
    const paymentRepository = new MemoryPaymentRepository();
    const invoiceRepository = new MemoryInvoiceRepository();
    const paymentService = new PaymentService({
      paymentRepository,
      orderRepository,
      paymentGatewayFactory: getPaymentGatewayFactory(),
    });
    const invoiceService = new InvoiceService({
      invoiceRepository,
      orderRepository,
    });

    const { address, cart } = await seedCartWithItem(module);
    const { method: shippingMethod } = await seedEligibleShipping(module);
    const taxRate = await module.taxRateService.createTaxRate(
      validTaxRateInput({ percentage: "10" }),
    );
    await module.taxRateService.activateTaxRate(TEST_STORE_A_ID, taxRate.id);

    const checkout = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      {
        customerAddressId: address.id,
        shippingMethodId: shippingMethod.id,
      },
    );
    orderRepository.seedOrder(checkout.order);

    const invoice = await invoiceService.createInvoice(
      TEST_STORE_A_ID,
      checkout.order.id,
      validInvoiceInput(),
    );

    expect(invoice.subtotal).toBe("100.00");
    expect(invoice.taxAmount).toBe("10.00");
    expect(invoice.shippingAmount).toBe("9.99");
    expect(invoice.total).toBe("119.99");
    expect(invoice.appliedTaxRate).toMatchObject({
      taxRateId: taxRate.id,
      percentageSnapshot: "10",
    });

    const payment = await paymentService.createPayment(
      TEST_STORE_A_ID,
      checkout.order.id,
      validPaymentInput(),
    );
    expect(payment.amount).toBe("119.99");
  });

  it("keeps historical order tax when the live tax rate changes", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { method: shippingMethod } = await seedEligibleShipping(module);
    const taxRate = await module.taxRateService.createTaxRate(
      validTaxRateInput({ percentage: "10" }),
    );
    await module.taxRateService.activateTaxRate(TEST_STORE_A_ID, taxRate.id);

    const checkout = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      {
        customerAddressId: address.id,
        shippingMethodId: shippingMethod.id,
      },
    );

    await module.taxRateService.updateTaxRate(TEST_STORE_A_ID, taxRate.id, {
      percentage: "20",
    });

    expect(checkout.order.appliedTaxRate?.percentageSnapshot).toBe("10");
    expect(checkout.order.taxAmount).toBe("10.00");
    expect(checkout.order.shippingAmount).toBe("9.99");
    expect(checkout.order.total).toBe("119.99");
  });
});
