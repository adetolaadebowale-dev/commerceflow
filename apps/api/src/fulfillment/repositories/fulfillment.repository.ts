import type { OrderFulfillmentResult } from "@commerceflow/types";

export interface FulfillmentRepository {
  fulfillOrder(storeId: string, orderId: string): Promise<OrderFulfillmentResult>;
}
