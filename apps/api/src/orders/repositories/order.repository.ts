import type { Order, CatalogueListResult } from "@commerceflow/types";
import type { ListOrdersQuery } from "@commerceflow/validation";

import type { CreateOrderRecord } from "./order-create-record";

export type {
  CreateOrderRecord,
  OrderVariantSnapshot,
  PreparedOrderItem,
} from "./order-create-record";

export interface OrderRepository {
  findById(storeId: string, id: string): Promise<Order | null>;
  list(query: ListOrdersQuery): Promise<CatalogueListResult<Order>>;
  create(record: CreateOrderRecord): Promise<Order>;
}
