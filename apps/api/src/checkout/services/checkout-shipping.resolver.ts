import type { OrderShippingMethodSnapshot } from "@commerceflow/types";

import {
  getShippingMethodRepository,
  getShippingZoneRepository,
  type ShippingMethodRepository,
  type ShippingZoneRepository,
} from "@/shipping-configuration/repositories";
import { CHECKOUT_ERROR_CODES, CheckoutError } from "../errors";

export interface ResolvedCheckoutShipping {
  readonly shippingAmount: string;
  readonly appliedShippingMethod: OrderShippingMethodSnapshot;
}

export interface CheckoutShippingResolverDependencies {
  readonly shippingMethodRepository?: ShippingMethodRepository;
  readonly shippingZoneRepository?: ShippingZoneRepository;
}

export class CheckoutShippingResolver {
  private readonly shippingMethodRepository: ShippingMethodRepository;
  private readonly shippingZoneRepository: ShippingZoneRepository;

  constructor(dependencies: CheckoutShippingResolverDependencies = {}) {
    this.shippingMethodRepository =
      dependencies.shippingMethodRepository ?? getShippingMethodRepository();
    this.shippingZoneRepository =
      dependencies.shippingZoneRepository ?? getShippingZoneRepository();
  }

  async resolveShipping(
    storeId: string,
    shippingMethodId: string,
    destinationCountryCode: string,
    orderCurrency: string,
  ): Promise<ResolvedCheckoutShipping> {
    const method = await this.shippingMethodRepository.findById(
      storeId,
      shippingMethodId,
    );

    if (!method) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.SHIPPING_METHOD_NOT_FOUND,
        "Shipping method not found",
        404,
      );
    }

    if (method.status !== "active") {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.SHIPPING_METHOD_INACTIVE,
        "Shipping method is not active",
        409,
      );
    }

    const zone = await this.shippingZoneRepository.findById(
      storeId,
      method.shippingZoneId,
    );

    if (!zone) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.SHIPPING_ZONE_NOT_FOUND,
        "Shipping zone not found",
        404,
      );
    }

    if (zone.status !== "active") {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.SHIPPING_ZONE_INACTIVE,
        "Shipping zone is not active",
        409,
      );
    }

    const normalizedCountry = destinationCountryCode.toUpperCase();

    if (!zone.countries.includes(normalizedCountry)) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.SHIPPING_COUNTRY_NOT_COVERED,
        "Shipping method does not cover the destination country",
        400,
      );
    }

    if (method.currency !== orderCurrency) {
      throw new CheckoutError(
        CHECKOUT_ERROR_CODES.SHIPPING_CURRENCY_MISMATCH,
        "Shipping method currency does not match order currency",
        400,
      );
    }

    return {
      shippingAmount: method.flatRate,
      appliedShippingMethod: {
        shippingMethodId: method.id,
        shippingZoneId: zone.id,
        methodNameSnapshot: method.name,
        zoneNameSnapshot: zone.name,
        carrierSnapshot: method.carrier,
        flatRateSnapshot: method.flatRate,
        currencySnapshot: method.currency,
        shippingAmount: method.flatRate,
      },
    };
  }
}

export const checkoutShippingResolver = new CheckoutShippingResolver();
