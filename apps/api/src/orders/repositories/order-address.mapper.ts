import type { OrderAddressSnapshot } from "@commerceflow/types";

export function toOrderAddressSnapshot(order: {
  shippingRecipientName?: string | null;
  shippingPhone?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingStateProvince?: string | null;
  shippingPostalCode?: string | null;
  shippingCountryCode?: string | null;
}): OrderAddressSnapshot | undefined {
  if (!order.shippingRecipientName || !order.shippingAddressLine1) {
    return undefined;
  }

  return {
    recipientName: order.shippingRecipientName,
    phone: order.shippingPhone ?? undefined,
    addressLine1: order.shippingAddressLine1,
    addressLine2: order.shippingAddressLine2 ?? undefined,
    city: order.shippingCity ?? "",
    stateProvince: order.shippingStateProvince ?? "",
    postalCode: order.shippingPostalCode ?? "",
    countryCode: order.shippingCountryCode ?? "",
  };
}

export function buildShippingAddressCreateData(
  shippingAddress: OrderAddressSnapshot,
) {
  return {
    shippingRecipientName: shippingAddress.recipientName,
    shippingPhone: shippingAddress.phone,
    shippingAddressLine1: shippingAddress.addressLine1,
    shippingAddressLine2: shippingAddress.addressLine2,
    shippingCity: shippingAddress.city,
    shippingStateProvince: shippingAddress.stateProvince,
    shippingPostalCode: shippingAddress.postalCode,
    shippingCountryCode: shippingAddress.countryCode,
  };
}
