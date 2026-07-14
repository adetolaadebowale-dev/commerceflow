import {
  type Cart as PrismaCart,
  type CartItem as PrismaCartItem,
  type Order as PrismaOrder,
  type OrderItem as PrismaOrderItem,
  type PrismaClient,
} from "@prisma/client";
import type { Cart, CheckoutResult, Order, OrderItem } from "@commerceflow/types";

import { toOrderAddressSnapshot } from "@/orders/repositories/order-address.mapper";
import { buildShippingAddressCreateData } from "@/orders/repositories/order-address.mapper";
import { generateOrderNumber } from "@/orders/services/order-pricing";
import { isUniqueOrderNumberViolation } from "@/orders/repositories/prisma-order-variant-snapshot.reader";
import type { CheckoutRecord, CheckoutRepository } from "./checkout.repository";

type CartWithItems = PrismaCart & { items: PrismaCartItem[] };
type OrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

const MAX_ORDER_NUMBER_ATTEMPTS = 5;
const itemsInclude = { orderBy: { createdAt: "asc" as const } };

function toCartItem(record: PrismaCartItem) {
  return {
    id: record.id,
    cartId: record.cartId,
    productVariantId: record.productVariantId,
    quantity: record.quantity,
    unitPriceSnapshot: record.unitPriceSnapshot.toString(),
    currencySnapshot: record.currencySnapshot,
    lineSubtotal: record.lineSubtotal.toString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toCart(record: CartWithItems): Cart {
  return {
    id: record.id,
    storeId: record.storeId,
    customerId: record.customerId,
    status: record.status,
    subtotal: record.subtotal.toString(),
    currency: record.currency,
    items: record.items.map(toCartItem),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toOrderItem(record: PrismaOrderItem): OrderItem {
  return {
    id: record.id,
    orderId: record.orderId,
    productVariantId: record.productVariantId,
    productName: record.productName,
    sku: record.sku,
    unitPrice: record.unitPrice.toString(),
    currency: record.currency,
    quantity: record.quantity,
    lineSubtotal: record.lineSubtotal.toString(),
    createdAt: record.createdAt.toISOString(),
  };
}

function toOrder(record: OrderWithItems): Order {
  return {
    id: record.id,
    storeId: record.storeId,
    customerId: record.customerId ?? undefined,
    customerProfileId: record.customerProfileId ?? undefined,
    sourceCartId: record.sourceCartId ?? undefined,
    orderNumber: record.orderNumber,
    status: record.status,
    subtotal: record.subtotal.toString(),
    currency: record.currency,
    shippingAddress: toOrderAddressSnapshot(record),
    items: record.items.map(toOrderItem),
    confirmedAt: record.confirmedAt?.toISOString(),
    cancelledAt: record.cancelledAt?.toISOString(),
    fulfilledAt: record.fulfilledAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaCheckoutRepository implements CheckoutRepository {
  constructor(private readonly db: PrismaClient) {}

  async completeCheckout(record: CheckoutRecord): Promise<CheckoutResult> {
    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNumber = generateOrderNumber();

      try {
        return await this.db.$transaction(async (tx) => {
          const cart = await tx.cart.findFirst({
            where: {
              id: record.cartId,
              storeId: record.storeId,
              status: "active",
            },
            include: { items: itemsInclude },
          });

          if (!cart) {
            throw new Error(`Checkout cart not found: ${record.cartId}`);
          }

          const created = await tx.order.create({
            data: {
              storeId: record.storeId,
              customerProfileId: record.customerProfileId,
              sourceCartId: record.cartId,
              orderNumber,
              status: "draft",
              subtotal: record.subtotal,
              currency: record.currency,
              ...buildShippingAddressCreateData(record.shippingAddress),
              items: {
                create: record.items.map((item) => ({
                  productVariantId: item.productVariantId,
                  productName: item.productName,
                  sku: item.sku,
                  unitPrice: item.unitPrice,
                  currency: item.currency,
                  quantity: item.quantity,
                  lineSubtotal: item.lineSubtotal,
                })),
              },
            },
            include: { items: itemsInclude },
          });

          const converted = await tx.cart.updateMany({
            where: {
              id: record.cartId,
              storeId: record.storeId,
              status: "active",
            },
            data: { status: "converted" },
          });

          if (converted.count === 0) {
            throw new Error(`Checkout cart conversion failed: ${record.cartId}`);
          }

          const updatedCart = await tx.cart.findFirstOrThrow({
            where: { id: record.cartId, storeId: record.storeId },
            include: { items: itemsInclude },
          });

          return {
            order: toOrder(created),
            cart: toCart(updatedCart),
          };
        });
      } catch (error) {
        if (isUniqueOrderNumberViolation(error) && attempt < MAX_ORDER_NUMBER_ATTEMPTS - 1) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to generate a unique order number");
  }
}
