import {
  type Cart as PrismaCart,
  type CartItem as PrismaCartItem,
  type PrismaClient,
} from "@prisma/client";
import type { Cart, CartItem } from "@commerceflow/types";

import {
  buildLineSubtotal,
  calculateCartTotals,
} from "../services/cart-pricing";
import type {
  CartItemMutationResult,
  CartRepository,
  CreateCartRecord,
  PreparedCartItem,
} from "./cart.repository";

type CartWithItems = PrismaCart & {
  items: PrismaCartItem[];
};

const itemsInclude = {
  orderBy: { createdAt: "asc" as const },
};

function toCartItem(record: PrismaCartItem): CartItem {
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

async function loadCart(
  db: PrismaClient,
  storeId: string,
  cartId: string,
): Promise<CartWithItems | null> {
  return db.cart.findFirst({
    where: { id: cartId, storeId },
    include: { items: itemsInclude },
  });
}

export function isActiveCartConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(record: CreateCartRecord): Promise<Cart> {
    const created = await this.db.cart.create({
      data: {
        storeId: record.storeId,
        customerId: record.customerId,
        status: "active",
        subtotal: "0.00",
        currency: "USD",
      },
      include: { items: itemsInclude },
    });

    return toCart(created);
  }

  async findById(storeId: string, id: string): Promise<Cart | null> {
    const record = await loadCart(this.db, storeId, id);
    return record ? toCart(record) : null;
  }

  async findActiveByCustomerId(
    storeId: string,
    customerId: string,
  ): Promise<Cart | null> {
    const record = await this.db.cart.findFirst({
      where: { storeId, customerId, status: "active" },
      include: { items: itemsInclude },
    });

    return record ? toCart(record) : null;
  }

  async findByCartItemId(
    storeId: string,
    cartItemId: string,
  ): Promise<Cart | null> {
    const record = await this.db.cart.findFirst({
      where: {
        storeId,
        items: { some: { id: cartItemId } },
      },
      include: { items: itemsInclude },
    });

    return record ? toCart(record) : null;
  }

  async addOrMergeItem(
    storeId: string,
    cartId: string,
    item: PreparedCartItem,
  ): Promise<CartItemMutationResult> {
    return this.db.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { id: cartId, storeId },
        include: { items: itemsInclude },
      });

      if (!cart) {
        throw new Error(`Cart not found: ${cartId}`);
      }

      const existing = cart.items.find(
        (line) => line.productVariantId === item.productVariantId,
      );

      if (existing) {
        const quantity = existing.quantity + item.quantity;
        const lineSubtotal = buildLineSubtotal(
          existing.unitPriceSnapshot.toString(),
          quantity,
        );

        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity, lineSubtotal },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPriceSnapshot: item.unitPriceSnapshot,
            currencySnapshot: item.currencySnapshot,
            lineSubtotal: item.lineSubtotal,
          },
        });
      }

      const refreshed = await tx.cart.findFirstOrThrow({
        where: { id: cartId, storeId },
        include: { items: itemsInclude },
      });
      const totals = calculateCartTotals(refreshed.items.map(toCartItem));

      const updated = await tx.cart.update({
        where: { id: cartId },
        data: {
          subtotal: totals.subtotal,
          currency: totals.currency,
        },
        include: { items: itemsInclude },
      });

      const cartDto = toCart(updated);
      const cartItem = existing
        ? cartDto.items.find((line) => line.productVariantId === item.productVariantId)!
        : cartDto.items[cartDto.items.length - 1]!;

      return {
        cart: cartDto,
        cartItem,
        merged: Boolean(existing),
      };
    });
  }

  async updateItemQuantity(
    storeId: string,
    cartItemId: string,
    quantity: number,
    lineSubtotal: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findFirst({
        where: { id: cartItemId, cart: { storeId } },
        include: { cart: { include: { items: itemsInclude } } },
      });

      if (!cartItem) {
        throw new Error(`CartItem not found: ${cartItemId}`);
      }

      await tx.cartItem.update({
        where: { id: cartItemId },
        data: { quantity, lineSubtotal },
      });

      const refreshed = await tx.cart.findFirstOrThrow({
        where: { id: cartItem.cartId, storeId },
        include: { items: itemsInclude },
      });
      const totals = calculateCartTotals(refreshed.items.map(toCartItem));

      const updated = await tx.cart.update({
        where: { id: cartItem.cartId },
        data: {
          subtotal: totals.subtotal,
          currency: totals.currency,
        },
        include: { items: itemsInclude },
      });

      const cartDto = toCart(updated);
      return {
        cart: cartDto,
        cartItem: cartDto.items.find((line) => line.id === cartItemId)!,
      };
    });
  }

  async removeItem(storeId: string, cartItemId: string) {
    return this.db.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findFirst({
        where: { id: cartItemId, cart: { storeId } },
      });

      if (!cartItem) {
        throw new Error(`CartItem not found: ${cartItemId}`);
      }

      await tx.cartItem.delete({ where: { id: cartItemId } });

      const refreshed = await tx.cart.findFirstOrThrow({
        where: { id: cartItem.cartId, storeId },
        include: { items: itemsInclude },
      });
      const totals = calculateCartTotals(refreshed.items.map(toCartItem));

      const updated = await tx.cart.update({
        where: { id: cartItem.cartId },
        data: {
          subtotal: totals.subtotal,
          currency: totals.currency,
        },
        include: { items: itemsInclude },
      });

      return {
        cart: toCart(updated),
        removedItemId: cartItemId,
      };
    });
  }

  async markConverted(storeId: string, cartId: string): Promise<Cart> {
    const updated = await this.db.cart.updateMany({
      where: { id: cartId, storeId, status: "active" },
      data: { status: "converted" },
    });

    if (updated.count === 0) {
      throw new Error(`Cart not found: ${cartId}`);
    }

    const record = await this.db.cart.findFirstOrThrow({
      where: { id: cartId, storeId },
      include: { items: itemsInclude },
    });

    return toCart(record);
  }
}
