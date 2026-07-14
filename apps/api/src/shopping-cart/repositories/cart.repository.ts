import type { Cart, CartItem } from "@commerceflow/types";

export interface CreateCartRecord {
  readonly storeId: string;
  readonly customerId: string;
}

export interface PreparedCartItem {
  readonly productVariantId: string;
  readonly quantity: number;
  readonly unitPriceSnapshot: string;
  readonly currencySnapshot: string;
  readonly lineSubtotal: string;
}

export interface CartItemMutationResult {
  readonly cart: Cart;
  readonly cartItem: CartItem;
  readonly merged: boolean;
}

export interface CartRepository {
  create(record: CreateCartRecord): Promise<Cart>;
  findById(storeId: string, id: string): Promise<Cart | null>;
  findActiveByCustomerId(
    storeId: string,
    customerId: string,
  ): Promise<Cart | null>;
  findByCartItemId(storeId: string, cartItemId: string): Promise<Cart | null>;
  addOrMergeItem(
    storeId: string,
    cartId: string,
    item: PreparedCartItem,
  ): Promise<CartItemMutationResult>;
  updateItemQuantity(
    storeId: string,
    cartItemId: string,
    quantity: number,
    lineSubtotal: string,
  ): Promise<{ readonly cart: Cart; readonly cartItem: CartItem }>;
  removeItem(
    storeId: string,
    cartItemId: string,
  ): Promise<{ readonly cart: Cart; readonly removedItemId: string }>;
}
