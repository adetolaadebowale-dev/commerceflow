import type { Cart } from "@commerceflow/types";
import type {
  AddCartItemInput,
  CreateCartInput,
  UpdateCartItemInput,
} from "@commerceflow/validation";

import {
  getCustomerRepository,
  type CustomerRepository,
} from "@/customers/repositories";
import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getOrderVariantSnapshotReader,
  type OrderVariantSnapshotReader,
} from "@/orders/repositories";
import { CART_ERROR_CODES, CartError } from "../errors";
import { getCartRepository, type CartRepository } from "../repositories";
import { buildLineSubtotal } from "./cart-pricing";

export interface CartServiceDependencies {
  readonly cartRepository?: CartRepository;
  readonly customerRepository?: CustomerRepository;
  readonly variantSnapshotReader?: OrderVariantSnapshotReader;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class CartService {
  private readonly cartRepository: CartRepository;
  private readonly customerRepository: CustomerRepository;
  private readonly variantSnapshotReader: OrderVariantSnapshotReader;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: CartServiceDependencies = {}) {
    this.cartRepository = dependencies.cartRepository ?? getCartRepository();
    this.customerRepository =
      dependencies.customerRepository ?? getCustomerRepository();
    this.variantSnapshotReader =
      dependencies.variantSnapshotReader ?? getOrderVariantSnapshotReader();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createCart(input: CreateCartInput): Promise<Cart> {
    await this.ensureCustomerExists(input.storeId, input.customerId);

    const existing = await this.cartRepository.findActiveByCustomerId(
      input.storeId,
      input.customerId,
    );

    if (existing) {
      throw new CartError(
        CART_ERROR_CODES.ALREADY_ACTIVE,
        "Customer already has an active cart",
        409,
      );
    }

    try {
      const cart = await this.cartRepository.create({
        storeId: input.storeId,
        customerId: input.customerId,
      });
      this.domainEventPublisher.publishCartCreated(cart);
      return cart;
    } catch (error) {
      if (isActiveCartConflict(error)) {
        throw new CartError(
          CART_ERROR_CODES.ALREADY_ACTIVE,
          "Customer already has an active cart",
          409,
        );
      }

      throw error;
    }
  }

  async getCart(storeId: string, id: string): Promise<Cart> {
    const cart = await this.cartRepository.findById(storeId, id);

    if (!cart) {
      throw new CartError(
        CART_ERROR_CODES.NOT_FOUND,
        "Cart not found",
        404,
      );
    }

    return cart;
  }

  async getActiveCartByCustomerId(
    storeId: string,
    customerId: string,
  ): Promise<Cart> {
    await this.ensureCustomerExists(storeId, customerId);

    const cart = await this.cartRepository.findActiveByCustomerId(
      storeId,
      customerId,
    );

    if (!cart) {
      throw new CartError(
        CART_ERROR_CODES.NOT_FOUND,
        "Active cart not found",
        404,
      );
    }

    return cart;
  }

  async addCartItem(
    storeId: string,
    cartId: string,
    input: AddCartItemInput,
  ): Promise<Cart> {
    const cart = await this.requireActiveCart(storeId, cartId);
    const snapshot = await this.variantSnapshotReader.findVariantSnapshot(
      storeId,
      input.productVariantId,
    );

    if (!snapshot) {
      throw new CartError(
        CART_ERROR_CODES.VARIANT_NOT_FOUND,
        "Product variant not found",
        404,
      );
    }

    this.assertCurrencyCompatible(cart, snapshot.currency);

    try {
      const result = await this.cartRepository.addOrMergeItem(storeId, cartId, {
        productVariantId: snapshot.productVariantId,
        quantity: input.quantity,
        unitPriceSnapshot: snapshot.unitPrice,
        currencySnapshot: snapshot.currency,
        lineSubtotal: buildLineSubtotal(snapshot.unitPrice, input.quantity),
      });

      if (result.merged) {
        this.domainEventPublisher.publishCartItemUpdated(
          result.cart,
          result.cartItem,
        );
      } else {
        this.domainEventPublisher.publishCartItemAdded(
          result.cart,
          result.cartItem,
        );
      }

      return result.cart;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateCartItem(
    storeId: string,
    cartItemId: string,
    input: UpdateCartItemInput,
  ): Promise<Cart> {
    const cart = await this.requireCartContainingItem(storeId, cartItemId);
    this.assertCartIsActive(cart);

    const existingItem = cart.items.find((item) => item.id === cartItemId)!;

    try {
      const result = await this.cartRepository.updateItemQuantity(
        storeId,
        cartItemId,
        input.quantity,
        buildLineSubtotal(existingItem.unitPriceSnapshot, input.quantity),
      );
      this.domainEventPublisher.publishCartItemUpdated(
        result.cart,
        result.cartItem,
      );
      return result.cart;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async removeCartItem(storeId: string, cartItemId: string): Promise<Cart> {
    const cart = await this.requireCartContainingItem(storeId, cartItemId);
    this.assertCartIsActive(cart);
    const removedItem = cart.items.find((item) => item.id === cartItemId)!;

    try {
      const result = await this.cartRepository.removeItem(storeId, cartItemId);
      this.domainEventPublisher.publishCartItemRemoved(
        result.cart,
        result.removedItemId,
        removedItem.productVariantId,
      );
      return result.cart;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async ensureCustomerExists(storeId: string, customerId: string) {
    const customer = await this.customerRepository.findById(storeId, customerId);

    if (!customer) {
      throw new CartError(
        CART_ERROR_CODES.CUSTOMER_NOT_FOUND,
        "Customer not found",
        404,
      );
    }
  }

  private async requireActiveCart(storeId: string, cartId: string): Promise<Cart> {
    const cart = await this.getCart(storeId, cartId);
    this.assertCartIsActive(cart);
    return cart;
  }

  private async requireCartContainingItem(
    storeId: string,
    cartItemId: string,
  ): Promise<Cart> {
    const cart = await this.cartRepository.findByCartItemId(storeId, cartItemId);

    if (!cart) {
      throw new CartError(
        CART_ERROR_CODES.ITEM_NOT_FOUND,
        "Cart item not found",
        404,
      );
    }

    return cart;
  }

  private assertCartIsActive(cart: Cart) {
    if (cart.status !== "active") {
      throw new CartError(
        CART_ERROR_CODES.IMMUTABLE,
        "Cart cannot be modified in its current status",
        409,
      );
    }
  }

  private assertCurrencyCompatible(cart: Cart, currency: string) {
    if (cart.items.length > 0 && cart.currency !== currency) {
      throw new CartError(
        CART_ERROR_CODES.CURRENCY_MISMATCH,
        "All cart items must use the same currency",
        400,
      );
    }
  }

  private mapRepositoryError(error: unknown): CartError {
    if (error instanceof Error && error.message.startsWith("Cart not found:")) {
      return new CartError(
        CART_ERROR_CODES.NOT_FOUND,
        "Cart not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("CartItem not found:")
    ) {
      return new CartError(
        CART_ERROR_CODES.ITEM_NOT_FOUND,
        "Cart item not found",
        404,
      );
    }

    if (error instanceof CartError) {
      return error;
    }

    throw error;
  }
}

function isActiveCartConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export const cartService = new CartService();
