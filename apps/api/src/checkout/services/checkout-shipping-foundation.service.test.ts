import { describe, expect, it, vi } from "vitest";

import { CHECKOUT_ERROR_CODES } from "@/checkout/errors";
import { validInvoiceInput } from "@/invoices/testing/invoice-test-utils";
import { validPaymentInput } from "@/payments/testing/payment-test-utils";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { PaymentService } from "@/payments/services/payment.service";
import { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import { InvoiceService } from "@/invoices/services/invoice.service";
import { getPaymentGatewayFactory } from "@/payments/gateways";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPromotionRedemptionModule,
  seedCartWithItem,
  seedEligibleShipping,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/promotion-redemption/testing/promotion-redemption-test-utils";

describe("Checkout shipping foundation integration", () => {
  it("resolves eligible shipping and calculates totals", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { zone, method } = await seedEligibleShipping(module, {
      flatRate: "12.50",
    });

    const result = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      },
    );

    expect(result.order.subtotal).toBe("100.00");
    expect(result.order.shippingAmount).toBe("12.50");
    expect(result.order.total).toBe("112.50");
    expect(result.order.appliedShippingMethod).toMatchObject({
      shippingMethodId: method.id,
      shippingZoneId: zone.id,
      methodNameSnapshot: "Standard Shipping",
      zoneNameSnapshot: "Domestic",
      flatRateSnapshot: "12.50",
      currencySnapshot: "USD",
      shippingAmount: "12.50",
    });
  });

  it("rejects checkout when destination country is not covered", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { method } = await seedEligibleShipping(module, {
      countries: ["CA"],
    });

    await expect(
      module.checkoutService.checkoutCart(TEST_STORE_A_ID, cart.id, {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      }),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.SHIPPING_COUNTRY_NOT_COVERED,
      status: 400,
    });
  });

  it("rejects checkout when shipping zone is inactive", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const zone = await module.shippingZoneService.createShippingZone({
      storeId: TEST_STORE_A_ID,
      name: "Inactive Zone",
      countries: ["US"],
      status: "active",
    });
    const method = await module.shippingMethodService.createShippingMethod({
      storeId: TEST_STORE_A_ID,
      shippingZoneId: zone.id,
      name: "Standard",
      carrier: "internal",
      flatRate: "9.99",
      currency: "USD",
      status: "active",
    });

    await module.shippingMethodService.updateShippingMethod(
      TEST_STORE_A_ID,
      method.id,
      { status: "inactive" },
    );
    await module.shippingZoneService.updateShippingZone(
      TEST_STORE_A_ID,
      zone.id,
      { status: "inactive" },
    );
    await module.shippingMethodRepository.update(
      TEST_STORE_A_ID,
      method.id,
      { status: "active" },
    );

    await expect(
      module.checkoutService.checkoutCart(TEST_STORE_A_ID, cart.id, {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      }),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.SHIPPING_ZONE_INACTIVE,
      status: 409,
    });
  });

  it("rejects checkout when shipping method is inactive", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const zone = await module.shippingZoneService.createShippingZone({
      storeId: TEST_STORE_A_ID,
      name: "Active Zone",
      countries: ["US"],
      status: "active",
    });
    const method = await module.shippingMethodService.createShippingMethod({
      storeId: TEST_STORE_A_ID,
      shippingZoneId: zone.id,
      name: "Inactive Method",
      carrier: "internal",
      flatRate: "9.99",
      currency: "USD",
      status: "inactive",
    });

    await expect(
      module.checkoutService.checkoutCart(TEST_STORE_A_ID, cart.id, {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      }),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.SHIPPING_METHOD_INACTIVE,
      status: 409,
    });
  });

  it("snapshots shipping on invoice and uses order total for payment", async () => {
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
    const { method } = await seedEligibleShipping(module, { flatRate: "7.00" });

    const checkout = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      },
    );
    orderRepository.seedOrder(checkout.order);

    const invoice = await invoiceService.createInvoice(
      TEST_STORE_A_ID,
      checkout.order.id,
      validInvoiceInput(),
    );

    expect(invoice.shippingAmount).toBe("7.00");
    expect(invoice.total).toBe("107.00");
    expect(invoice.appliedShippingMethod).toMatchObject({
      shippingMethodId: method.id,
      flatRateSnapshot: "7.00",
    });

    const payment = await paymentService.createPayment(
      TEST_STORE_A_ID,
      checkout.order.id,
      validPaymentInput(),
    );
    expect(payment.amount).toBe("107.00");
  });

  it("keeps historical shipping snapshot when live configuration changes", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { method } = await seedEligibleShipping(module, { flatRate: "9.99" });

    const checkout = await module.checkoutService.checkoutCart(
      TEST_STORE_A_ID,
      cart.id,
      {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      },
    );

    await module.shippingMethodService.updateShippingMethod(
      TEST_STORE_A_ID,
      method.id,
      { flatRate: "25.00" },
    );

    expect(checkout.order.appliedShippingMethod?.flatRateSnapshot).toBe("9.99");
    expect(checkout.order.shippingAmount).toBe("9.99");
    expect(checkout.order.total).toBe("109.99");
  });

  it("isolates shipping method lookup by store", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { method } = await seedEligibleShipping(module);

    await expect(
      module.checkoutService.checkoutCart(TEST_STORE_B_ID, cart.id, {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      }),
    ).rejects.toMatchObject({
      code: CHECKOUT_ERROR_CODES.CART_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back checkout when the transaction fails", async () => {
    const module = createMemoryPromotionRedemptionModule();
    const { address, cart } = await seedCartWithItem(module);
    const { method } = await seedEligibleShipping(module);
    module.checkoutRepository.setTransactionFailure(new Error("db failure"));

    await expect(
      module.checkoutService.checkoutCart(TEST_STORE_A_ID, cart.id, {
        customerAddressId: address.id,
        shippingMethodId: method.id,
      }),
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

  it("emits checkout.shipping.selected before checkout.completed", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const shippingHandler = vi.fn();
    const completedHandler = vi.fn();
    dispatcher.subscribe("checkout.shipping.selected", shippingHandler);
    dispatcher.subscribe("checkout.completed", completedHandler);

    const module = createMemoryPromotionRedemptionModule({
      domainEventPublisher: publisher,
    });
    const { address, cart } = await seedCartWithItem(module);
    const { method } = await seedEligibleShipping(module);

    await module.checkoutService.checkoutCart(TEST_STORE_A_ID, cart.id, {
      customerAddressId: address.id,
      shippingMethodId: method.id,
    });

    await vi.waitFor(() => {
      expect(shippingHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
    });

    expect(shippingHandler.mock.calls[0]?.[0].eventType).toBe(
      "checkout.shipping.selected",
    );
    expect(completedHandler.mock.calls[0]?.[0].eventType).toBe(
      "checkout.completed",
    );
  });
});
