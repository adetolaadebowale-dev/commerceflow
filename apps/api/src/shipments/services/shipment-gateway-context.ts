import type { Shipment } from "@commerceflow/types";
import type { ShipmentDispatchContext } from "@commerceflow/types";

export function toShipmentDispatchContext(
  shipment: Shipment,
  metadata?: Record<string, unknown>,
): ShipmentDispatchContext {
  return {
    storeId: shipment.storeId,
    orderId: shipment.orderId,
    shipmentId: shipment.id,
    shipmentNumber: shipment.shipmentNumber,
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    shippingRecipientName: shipment.shippingRecipientName,
    shippingPhone: shipment.shippingPhone,
    shippingAddressLine1: shipment.shippingAddressLine1,
    shippingAddressLine2: shipment.shippingAddressLine2,
    shippingCity: shipment.shippingCity,
    shippingStateProvince: shipment.shippingStateProvince,
    shippingPostalCode: shipment.shippingPostalCode,
    shippingCountryCode: shipment.shippingCountryCode,
    metadata,
  };
}
