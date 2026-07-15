import type { Order } from "@commerceflow/types";

import { InvoiceService } from "@/invoices/services/invoice.service";
import { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import { validInvoiceInput } from "@/invoices/testing/invoice-test-utils";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import {
  createDraftOrder,
  seedVariant,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_VARIANT_A_ID,
} from "@/orders/testing/order-test-utils";
import { getPaymentGatewayFactory } from "@/payments/gateways";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { PaymentService } from "@/payments/services/payment.service";
import { validPaymentInput } from "@/payments/testing/payment-test-utils";
import {
  createMemoryPromotionRedemptionModule,
  seedCartWithItem,
  seedEligibleShipping,
  validActivePromotionInput,
} from "@/promotion-redemption/testing/promotion-redemption-test-utils";
import { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import { RefundService } from "@/refunds/services/refund.service";
import { validRefundInput } from "@/refunds/testing/refund-test-utils";
import { OrderService } from "@/orders/services/order.service";

export { TEST_STORE_A_ID, TEST_STORE_B_ID, validPaymentInput, validInvoiceInput, validRefundInput };

export function createFinancialTotalsModule() {
  const promoModule = createMemoryPromotionRedemptionModule();
  const orderRepository = new MemoryOrderRepository();
  const paymentRepository = new MemoryPaymentRepository();
  const invoiceRepository = new MemoryInvoiceRepository();
  const refundRepository = new MemoryRefundRepository();

  const orderService = new OrderService({
    orderRepository,
    orderVariantSnapshotReader: promoModule.variantSnapshotReader,
  });

  const paymentService = new PaymentService({
    paymentRepository,
    orderRepository,
    paymentGatewayFactory: getPaymentGatewayFactory(),
  });

  const invoiceService = new InvoiceService({
    invoiceRepository,
    orderRepository,
  });

  const refundService = new RefundService({
    refundRepository,
    paymentRepository,
  });

  return {
    ...promoModule,
    orderRepository,
    orderService,
    paymentRepository,
    invoiceRepository,
    refundRepository,
    paymentService,
    invoiceService,
    refundService,
  };
}

export async function seedZeroDiscountOrder(
  module: ReturnType<typeof createFinancialTotalsModule>,
): Promise<Order> {
  seedVariant(module.variantSnapshotReader, {
    storeId: TEST_STORE_A_ID,
    productVariantId: TEST_VARIANT_A_ID,
    productName: "Classic Tee",
    sku: "TEE-001",
    unitPrice: "19.99",
    currency: "USD",
  });

  const order = await createDraftOrder(
    module.orderService,
    module.variantSnapshotReader,
  );
  module.orderRepository.seedOrder(order);
  return order;
}

export async function seedDiscountedOrder(
  module: ReturnType<typeof createFinancialTotalsModule>,
  input: { discountAmount: string; total: string },
): Promise<Order> {
  const order = await seedZeroDiscountOrder(module);
  module.orderRepository.setOrderFinancials(order.id, {
    discountAmount: input.discountAmount,
    total: input.total,
  });

  const updated = await module.orderRepository.findById(
    TEST_STORE_A_ID,
    order.id,
  );

  if (!updated) {
    throw new Error("Failed to seed discounted order");
  }

  return updated;
}

export async function checkoutWithPercentagePromotion(
  module: ReturnType<typeof createFinancialTotalsModule>,
  code: string,
  value: string,
) {
  const { address, cart } = await seedCartWithItem(module);
  const { method: shippingMethod } = await seedEligibleShipping(module);

  await module.promotionRepository.create(
    validActivePromotionInput({ code, value, type: "percentage" }),
  );

  await module.promotionRedemptionService.applyPromotion(
    TEST_STORE_A_ID,
    cart.id,
    { code },
  );

  const result = await module.checkoutService.checkoutCart(
    TEST_STORE_A_ID,
    cart.id,
    {
      customerAddressId: address.id,
      shippingMethodId: shippingMethod.id,
    },
  );

  module.orderRepository.seedOrder(result.order);
  return result;
}

export async function checkoutWithFixedPromotion(
  module: ReturnType<typeof createFinancialTotalsModule>,
  code: string,
  value: string,
) {
  const { address, cart } = await seedCartWithItem(module);
  const { method: shippingMethod } = await seedEligibleShipping(module);

  await module.promotionRepository.create(
    validActivePromotionInput({ code, value, type: "fixed_amount" }),
  );

  await module.promotionRedemptionService.applyPromotion(
    TEST_STORE_A_ID,
    cart.id,
    { code },
  );

  const result = await module.checkoutService.checkoutCart(
    TEST_STORE_A_ID,
    cart.id,
    {
      customerAddressId: address.id,
      shippingMethodId: shippingMethod.id,
    },
  );

  module.orderRepository.seedOrder(result.order);
  return result;
}
