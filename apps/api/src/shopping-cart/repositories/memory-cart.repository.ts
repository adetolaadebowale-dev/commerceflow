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

export class MemoryCartRepository implements CartRepository {
  private readonly cartsById = new Map<string, Cart>();

  async create(record: CreateCartRecord): Promise<Cart> {
    const now = new Date().toISOString();
    const cart: Cart = {
      id: crypto.randomUUID(),
      storeId: record.storeId,
      customerId: record.customerId,
      status: "active",
      subtotal: "0.00",
      currency: "USD",
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    this.cartsById.set(cart.id, cart);
    return cart;
  }

  async findById(storeId: string, id: string): Promise<Cart | null> {
    const cart = this.cartsById.get(id);
    return cart?.storeId === storeId ? cart : null;
  }

  async findActiveByCustomerId(
    storeId: string,
    customerId: string,
  ): Promise<Cart | null> {
    for (const cart of this.cartsById.values()) {
      if (
        cart.storeId === storeId &&
        cart.customerId === customerId &&
        cart.status === "active"
      ) {
        return cart;
      }
    }

    return null;
  }

  async findByCartItemId(
    storeId: string,
    cartItemId: string,
  ): Promise<Cart | null> {
    for (const cart of this.cartsById.values()) {
      if (
        cart.storeId === storeId &&
        cart.items.some((line) => line.id === cartItemId)
      ) {
        return cart;
      }
    }

    return null;
  }

  async addOrMergeItem(
    storeId: string,
    cartId: string,
    item: PreparedCartItem,
  ): Promise<CartItemMutationResult> {
    const cart = await this.requireCart(storeId, cartId);
    const now = new Date().toISOString();
    const existing = cart.items.find(
      (line) => line.productVariantId === item.productVariantId,
    );

    if (existing) {
      const updatedItem: CartItem = {
        ...existing,
        quantity: existing.quantity + item.quantity,
        lineSubtotal: buildLineSubtotal(
          existing.unitPriceSnapshot,
          existing.quantity + item.quantity,
        ),
        updatedAt: now,
      };
      const items = cart.items.map((line) =>
        line.id === existing.id ? updatedItem : line,
      );
      const totals = calculateCartTotals(items);
      const updatedCart = this.saveCart(cart, items, totals, now);

      return { cart: updatedCart, cartItem: updatedItem, merged: true };
    }

    const cartItem: CartItem = {
      id: crypto.randomUUID(),
      cartId,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      unitPriceSnapshot: item.unitPriceSnapshot,
      currencySnapshot: item.currencySnapshot,
      lineSubtotal: item.lineSubtotal,
      createdAt: now,
      updatedAt: now,
    };
    const items = [...cart.items, cartItem];
    const totals = calculateCartTotals(items);
    const updatedCart = this.saveCart(cart, items, totals, now);

    return { cart: updatedCart, cartItem, merged: false };
  }

  async updateItemQuantity(
    storeId: string,
    cartItemId: string,
    quantity: number,
    lineSubtotal: string,
  ) {
    const cart = await this.requireCartContainingItem(storeId, cartItemId);
    const now = new Date().toISOString();
    const cartItem = cart.items.find((line) => line.id === cartItemId)!;
    const updatedItem: CartItem = {
      ...cartItem,
      quantity,
      lineSubtotal,
      updatedAt: now,
    };
    const items = cart.items.map((line) =>
      line.id === cartItemId ? updatedItem : line,
    );
    const totals = calculateCartTotals(items);
    const updatedCart = this.saveCart(cart, items, totals, now);

    return { cart: updatedCart, cartItem: updatedItem };
  }

  async removeItem(storeId: string, cartItemId: string) {
    const cart = await this.requireCartContainingItem(storeId, cartItemId);
    const now = new Date().toISOString();
    const items = cart.items.filter((line) => line.id !== cartItemId);
    const totals = calculateCartTotals(items);
    const updatedCart = this.saveCart(cart, items, totals, now);

    return { cart: updatedCart, removedItemId: cartItemId };
  }

  async markConverted(storeId: string, cartId: string): Promise<Cart> {
    const cart = await this.requireCart(storeId, cartId);
    const updated: Cart = {
      ...cart,
      status: "converted",
      updatedAt: new Date().toISOString(),
    };
    this.cartsById.set(cartId, updated);
    return updated;
  }

  private async requireCart(storeId: string, cartId: string): Promise<Cart> {
    const cart = await this.findById(storeId, cartId);

    if (!cart) {
      throw new Error(`Cart not found: ${cartId}`);
    }

    return cart;
  }

  private async requireCartContainingItem(
    storeId: string,
    cartItemId: string,
  ): Promise<Cart> {
    for (const cart of this.cartsById.values()) {
      if (
        cart.storeId === storeId &&
        cart.items.some((line) => line.id === cartItemId)
      ) {
        return cart;
      }
    }

    throw new Error(`CartItem not found: ${cartItemId}`);
  }

  private saveCart(
    cart: Cart,
    items: CartItem[],
    totals: { subtotal: string; currency: string },
    updatedAt: string,
  ): Cart {
    const updated: Cart = {
      ...cart,
      items,
      subtotal: totals.subtotal,
      currency: totals.currency,
      updatedAt,
    };
    this.cartsById.set(cart.id, updated);
    return updated;
  }
}
