import type {
  CartItem,
  CheckoutResult,
  OrderAddressSnapshot,
} from "@commerceflow/types";
import type { CheckoutCartInput } from "@commerceflow/validation";

import {
  getCustomerAddressRepository,
  getCustomerRepository,
  type CustomerAddressRepository,
  type CustomerRepository,
} from "@/customers/repositories";
import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import type { PreparedOrderItem } from "@/orders/repositories/order-create-record";
import {
  getOrderVariantSnapshotReader,
  type OrderVariantSnapshotReader,
} from "@/orders/repositories";
import {
  calculatePromotionDiscountFromSnapshot,
  getPromotionRedemptionService,
  type PromotionRedemptionService,
} from "@/promotion-redemption/services";
import {
  getTaxRateService,
  type TaxRateService,
} from "@/tax-rates/services";
import {
  addPrice,
  calculateTaxAmount,
  multiplyPrice,
  subtractPrice,
  sumPrices,
} from "@/orders/services/order-pricing";
import {
  getCartRepository,
  type CartRepository,
} from "@/shopping-cart/repositories";
import { CHECKOUT_ERROR_CODES, CheckoutError } from "../errors";
import { getCheckoutRepository, type CheckoutRepository } from "../repositories";
import {
  CheckoutShippingResolver,
  checkoutShippingResolver,
} from "./checkout-shipping.resolver";

export interface CheckoutServiceDependencies {
  readonly checkoutRepository?: CheckoutRepository;
  readonly cartRepository?: CartRepository;
  readonly customerRepository?: CustomerRepository;
  readonly customerAddressRepository?: CustomerAddressRepository;
  readonly variantSnapshotReader?: OrderVariantSnapshotReader;
  readonly domainEventPublisher?: DomainEventPublisher;
  readonly promotionRedemptionService?: PromotionRedemptionService;
  readonly taxRateService?: TaxRateService;
  readonly checkoutShippingResolver?: CheckoutShippingResolver;
}

export class CheckoutService {
  private readonly checkoutRepository: CheckoutRepository;
  private readonly cartRepository: CartRepository;
  private readonly customerRepository: CustomerRepository;
  private readonly customerAddressRepository: CustomerAddressRepository;
  private readonly variantSnapshotReader: OrderVariantSnapshotReader;
  private readonly domainEventPublisher: DomainEventPublisher;
  private readonly promotionRedemptionService: PromotionRedemptionService;
  private readonly taxRateService: TaxRateService;
  private readonly checkoutShippingResolver: CheckoutShippingResolver;

  constructor(dependencies: CheckoutServiceDependencies = {}) {
    this.checkoutRepository =
      dependencies.checkoutRepository ?? getCheckoutRepository();
    this.cartRepository = dependencies.cartRepository ?? getCartRepository();
    this.customerRepository =
      dependencies.customerRepository ?? getCustomerRepository();
    this.customerAddressRepository =
      dependencies.customerAddressRepository ??
      getCustomerAddressRepository();
    this.variantSnapshotReader =
      dependencies.variantSnapshotReader ?? getOrderVariantSnapshotReader();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
    this.promotionRedemptionService =
      dependencies.promotionRedemptionService ?? getPromotionRedemptionService();
    this.taxRateService =
      dependencies.taxRateService ?? getTaxRateService();
    this.checkoutShippingResolver =
      dependencies.checkoutShippingResolver ?? checkoutShippingResolver;
  }

  async checkoutCart(
    storeId: string,
    cartId: string,
    input: CheckoutCartInput,
  ): Promise<CheckoutResult> {
    const cart = await this.cartRepository.findById(storeId, cartId);

    if (!cart) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.CART_NOT_FOUND,
        "Cart not found",
        404,
      );
    }

    if (cart.status !== "active") {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.CART_NOT_ACTIVE,
        "Cart is not active",
        409,
      );
    }

    if (cart.items.length === 0) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.EMPTY_CART,
        "Cart must contain at least one item",
        400,
      );
    }

    const customer = await this.customerRepository.findById(
      storeId,
      cart.customerId,
    );

    if (!customer) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.CUSTOMER_NOT_FOUND,
        "Customer not found",
        404,
      );
    }

    const address = await this.customerAddressRepository.findById(
      storeId,
      input.customerAddressId,
    );

    if (!address) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.ADDRESS_NOT_FOUND,
        "Customer address not found",
        404,
      );
    }

    if (address.customerId !== cart.customerId) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.ADDRESS_NOT_OWNED,
        "Customer address does not belong to the cart customer",
        400,
      );
    }

    const preparedItems = await this.prepareOrderItems(storeId, cart.items);
    const subtotal = sumPrices(preparedItems.map((item) => item.lineSubtotal));
    const currency = preparedItems[0]?.currency ?? "USD";
    const shippingAddress = toOrderAddressSnapshot(address);

    const appliedPromotion =
      await this.promotionRedemptionService.getAppliedPromotion(storeId, cartId);

    let discountAmount: string | undefined;
    let appliedPromotionSnapshot;

    if (appliedPromotion) {
      discountAmount = calculatePromotionDiscountFromSnapshot(
        subtotal,
        appliedPromotion,
        currency,
      );
      appliedPromotionSnapshot = {
        promotionId: appliedPromotion.promotionId,
        promotionCodeSnapshot: appliedPromotion.promotionCodeSnapshot,
        promotionTypeSnapshot: appliedPromotion.promotionTypeSnapshot,
        promotionValueSnapshot: appliedPromotion.promotionValueSnapshot,
        discountAmount,
      };
    }

    const taxableAmount = discountAmount
      ? subtractPrice(subtotal, discountAmount)
      : subtotal;

    const activeTaxRate = await this.taxRateService.getActiveTaxRate(storeId);
    let taxAmount: string | undefined;
    let appliedTaxRateSnapshot;

    if (activeTaxRate) {
      taxAmount = calculateTaxAmount(taxableAmount, activeTaxRate.percentage);
      appliedTaxRateSnapshot = {
        taxRateId: activeTaxRate.id,
        nameSnapshot: activeTaxRate.name,
        percentageSnapshot: activeTaxRate.percentage,
      };
    }

    const { shippingAmount, appliedShippingMethod } =
      await this.checkoutShippingResolver.resolveShipping(
        storeId,
        input.shippingMethodId,
        address.countryCode,
        currency,
      );

    const afterTax = taxAmount
      ? addPrice(taxableAmount, taxAmount)
      : taxableAmount;
    const total = addPrice(afterTax, shippingAmount);

    try {
      const result = await this.checkoutRepository.completeCheckout({
        storeId,
        cartId,
        customerProfileId: cart.customerId,
        customerAddressId: input.customerAddressId,
        shippingAddress,
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        total,
        currency,
        items: preparedItems,
        appliedPromotion: appliedPromotionSnapshot,
        appliedTaxRate: appliedTaxRateSnapshot,
        appliedShippingMethod,
      });

      this.domainEventPublisher.publishCheckoutShippingSelected(
        result.order,
        appliedShippingMethod,
        shippingAmount,
      );
      this.domainEventPublisher.publishCheckoutCompleted(
        result,
        input.customerAddressId,
      );

      return result;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async prepareOrderItems(
    storeId: string,
    cartItems: readonly CartItem[],
  ): Promise<PreparedOrderItem[]> {
    const preparedItems: PreparedOrderItem[] = [];
    let orderCurrency: string | undefined;

    for (const cartItem of cartItems) {
      const snapshot = await this.variantSnapshotReader.findVariantSnapshot(
        storeId,
        cartItem.productVariantId,
      );

      if (!snapshot) {
        throw new CheckoutError(
          CHECKOUT_ERROR_CODES.VARIANT_NOT_FOUND,
          "Product variant not found",
          404,
        );
      }

      if (!orderCurrency) {
        orderCurrency = cartItem.currencySnapshot;
      } else if (orderCurrency !== cartItem.currencySnapshot) {
        throw new CheckoutError(
          CHECKOUT_ERROR_CODES.CURRENCY_MISMATCH,
          "All cart items must use the same currency",
          400,
        );
      }

      preparedItems.push({
        productVariantId: cartItem.productVariantId,
        productName: snapshot.productName,
        sku: snapshot.sku,
        unitPrice: cartItem.unitPriceSnapshot,
        currency: cartItem.currencySnapshot,
        quantity: cartItem.quantity,
        lineSubtotal: multiplyPrice(
          cartItem.unitPriceSnapshot,
          cartItem.quantity,
        ),
      });
    }

    return preparedItems;
  }

  private mapRepositoryError(error: unknown): CheckoutError {
    if (
      error instanceof Error &&
      error.message.startsWith("Checkout cart not found:")
    ) {
      return new CheckoutError(
        CHECKOUT_ERROR_CODES.CART_NOT_FOUND,
        "Cart not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Checkout cart conversion failed:")
    ) {
      return new CheckoutError(
        CHECKOUT_ERROR_CODES.CART_NOT_ACTIVE,
        "Cart is not active",
        409,
      );
    }

    if (error instanceof CheckoutError) {
      return error;
    }

    return new CheckoutError(
      CHECKOUT_ERROR_CODES.TRANSACTION_FAILED,
      "Checkout transaction failed",
      500,
    );
  }
}

function toOrderAddressSnapshot(address: {
  recipientName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
}): OrderAddressSnapshot {
  return {
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    stateProvince: address.stateProvince,
    postalCode: address.postalCode,
    countryCode: address.countryCode,
  };
}

export const checkoutService = new CheckoutService();
