import {
  type Cart as PrismaCart,
  type CartItem as PrismaCartItem,
  type PrismaClient,
} from "@prisma/client";
import type { Cart, CheckoutResult } from "@commerceflow/types";

import {
  mapPrismaOrder,
  orderItemsInclude,
} from "@/orders/repositories/order.mapper";
import { buildShippingAddressCreateData } from "@/orders/repositories/order-address.mapper";
import { generateOrderNumber } from "@/orders/services/order-pricing";
import { isUniqueOrderNumberViolation } from "@/orders/repositories/prisma-order-variant-snapshot.reader";
import type { CheckoutRecord, CheckoutRepository } from "./checkout.repository";

type CartWithItems = PrismaCart & { items: PrismaCartItem[] };

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

export class PrismaCheckoutRepository implements CheckoutRepository {
  constructor(private readonly db: PrismaClient) {}

  async completeCheckout(record: CheckoutRecord): Promise<CheckoutResult> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
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
              discountAmount: record.discountAmount ?? null,
              taxAmount: record.taxAmount ?? null,
              total: record.total,
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
              ...(record.appliedPromotion
                ? {
                    appliedPromotion: {
                      create: {
                        storeId: record.storeId,
                        promotionId: record.appliedPromotion.promotionId,
                        promotionCodeSnapshot:
                          record.appliedPromotion.promotionCodeSnapshot,
                        promotionTypeSnapshot:
                          record.appliedPromotion.promotionTypeSnapshot,
                        promotionValueSnapshot:
                          record.appliedPromotion.promotionValueSnapshot,
                        discountAmount: record.appliedPromotion.discountAmount,
                      },
                    },
                  }
                : {}),
              ...(record.appliedTaxRate && record.taxAmount
                ? {
                    appliedTaxRate: {
                      create: {
                        storeId: record.storeId,
                        taxRateId: record.appliedTaxRate.taxRateId,
                        nameSnapshot: record.appliedTaxRate.nameSnapshot,
                        percentageSnapshot:
                          record.appliedTaxRate.percentageSnapshot,
                        taxAmount: record.taxAmount,
                      },
                    },
                  }
                : {}),
            },
            include: {
              items: orderItemsInclude,
              appliedPromotion: true,
              appliedTaxRate: true,
            },
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

          await tx.cartPromotion.deleteMany({
            where: { storeId: record.storeId, cartId: record.cartId },
          });

          const updatedCart = await tx.cart.findFirstOrThrow({
            where: { id: record.cartId, storeId: record.storeId },
            include: { items: itemsInclude },
          });

          return {
            order: mapPrismaOrder(created),
            cart: toCart(updatedCart),
          };
        });
      } catch (error) {
        if (isUniqueOrderNumberViolation(error) && attempt < 4) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to generate a unique order number");
  }
}
