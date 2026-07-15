import type { Order, OrderAddressSnapshot } from "@commerceflow/types";

import { SHIPMENT_ERROR_CODES, ShipmentError } from "../errors";

export function requireOrderShippingAddress(order: Order): OrderAddressSnapshot {
  const address = order.shippingAddress;

  if (!address) {
    throw new ShipmentError(
      SHIPMENT_ERROR_CODES.SHIPPING_ADDRESS_INCOMPLETE,
      "Order does not have a shipping address",
      409,
    );
  }

  if (
    !address.recipientName ||
    !address.addressLine1 ||
    !address.city ||
    !address.stateProvince ||
    !address.postalCode ||
    !address.countryCode
  ) {
    throw new ShipmentError(
      SHIPMENT_ERROR_CODES.SHIPPING_ADDRESS_INCOMPLETE,
      "Order shipping address is incomplete",
      409,
    );
  }

  return address;
}

export function toShipmentAddressFields(address: OrderAddressSnapshot) {
  return {
    shippingRecipientName: address.recipientName,
    shippingPhone: address.phone ?? "",
    shippingAddressLine1: address.addressLine1,
    shippingAddressLine2: address.addressLine2,
    shippingCity: address.city,
    shippingStateProvince: address.stateProvince,
    shippingPostalCode: address.postalCode,
    shippingCountryCode: address.countryCode,
  };
}
