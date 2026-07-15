import type { Cart, CheckoutResult, Order, OrderItem } from "@commerceflow/types";

import {
  buildShippingAddressCreateData,
  toOrderAddressSnapshot,
} from "@/orders/repositories/order-address.mapper";
import { generateOrderNumber } from "@/orders/services/order-pricing";
import type { MemoryCartRepository } from "@/shopping-cart/repositories/memory-cart.repository";
import type { CheckoutRecord, CheckoutRepository } from "./checkout.repository";

export class MemoryCheckoutRepository implements CheckoutRepository {
  private readonly ordersById = new Map<
    string,
    Order & { shippingFields: ReturnType<typeof buildShippingAddressCreateData> }
  >();
  private readonly cartsById = new Map<string, Cart>();
  private transactionFailure: Error | null = null;

  constructor(private readonly cartRepository?: MemoryCartRepository) {}

  seedCart(cart: Cart): void {
    this.cartsById.set(cart.id, cart);
  }

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async completeCheckout(record: CheckoutRecord): Promise<CheckoutResult> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const cart = this.cartsById.get(record.cartId);

    if (!cart || cart.storeId !== record.storeId || cart.status !== "active") {
      throw new Error(`Checkout cart not found: ${record.cartId}`);
    }

    const now = new Date().toISOString();
    const orderId = crypto.randomUUID();
    const shippingFields = buildShippingAddressCreateData(record.shippingAddress);

    const items: OrderItem[] = record.items.map((item) => ({
      id: crypto.randomUUID(),
      orderId,
      productVariantId: item.productVariantId,
      productName: item.productName,
      sku: item.sku,
      unitPrice: item.unitPrice,
      currency: item.currency,
      quantity: item.quantity,
      lineSubtotal: item.lineSubtotal,
      createdAt: now,
    }));

    const orderRecord = {
      id: orderId,
      storeId: record.storeId,
      customerProfileId: record.customerProfileId,
      sourceCartId: record.cartId,
      orderNumber: generateOrderNumber(),
      status: "draft" as const,
      subtotal: record.subtotal,
      discountAmount: record.discountAmount,
      taxAmount: record.taxAmount,
      total: record.total,
      currency: record.currency,
      appliedPromotion: record.appliedPromotion,
      appliedTaxRate: record.appliedTaxRate,
      items,
      createdAt: now,
      updatedAt: now,
      shippingFields,
    };

    const order: Order = {
      id: orderRecord.id,
      storeId: orderRecord.storeId,
      customerProfileId: orderRecord.customerProfileId,
      sourceCartId: orderRecord.sourceCartId,
      orderNumber: orderRecord.orderNumber,
      status: orderRecord.status,
      subtotal: orderRecord.subtotal,
      discountAmount: orderRecord.discountAmount,
      taxAmount: orderRecord.taxAmount,
      total: orderRecord.total,
      currency: orderRecord.currency,
      appliedPromotion: orderRecord.appliedPromotion,
      appliedTaxRate: orderRecord.appliedTaxRate,
      shippingAddress: toOrderAddressSnapshot(shippingFields),
      items: orderRecord.items,
      createdAt: orderRecord.createdAt,
      updatedAt: orderRecord.updatedAt,
    };

    this.ordersById.set(order.id, { ...order, shippingFields });

    const convertedCart: Cart = {
      ...cart,
      status: "converted",
      updatedAt: now,
    };
    this.cartsById.set(cart.id, convertedCart);
    if (this.cartRepository) {
      await this.cartRepository.markConverted(record.storeId, record.cartId);
    }

    return { order, cart: convertedCart };
  }
}
