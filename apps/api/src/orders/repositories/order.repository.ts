import type { Order, CatalogueListResult } from "@commerceflow/types";
import type { ListOrdersQuery } from "@commerceflow/validation";

import type { CreateOrderRecord } from "./order-create-record";
import type { OrderStatusTransitionInput } from "./order-status-transition";

export type {
  CreateOrderRecord,
  OrderVariantSnapshot,
  PreparedOrderItem,
} from "./order-create-record";
export type { OrderStatusTransitionInput } from "./order-status-transition";

export interface OrderRepository {
  findById(storeId: string, id: string): Promise<Order | null>;
  list(query: ListOrdersQuery): Promise<CatalogueListResult<Order>>;
  create(record: CreateOrderRecord): Promise<Order>;
  transitionStatus(
    storeId: string,
    id: string,
    transition: OrderStatusTransitionInput,
  ): Promise<Order>;
}
