import type {
  OrderFulfillmentResult,
  ShipmentFulfillmentResult,
} from "@commerceflow/types";

export interface FulfillmentRepository {
  fulfillOrder(storeId: string, orderId: string): Promise<OrderFulfillmentResult>;
  fulfillShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<ShipmentFulfillmentResult>;
}
