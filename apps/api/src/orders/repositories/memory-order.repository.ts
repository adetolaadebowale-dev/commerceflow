import {
  buildCatalogueListResult,
  type Order,
  type OrderItem,
  type CatalogueListResult,
} from "@commerceflow/types";
import type { ListOrdersQuery } from "@commerceflow/validation";

import { generateOrderNumber } from "../services/order-pricing";
import type { CreateOrderRecord } from "./order-create-record";
import type { OrderRepository } from "./order.repository";
import type { OrderStatusTransitionInput } from "./order-status-transition";

export class MemoryOrderRepository implements OrderRepository {
  private readonly ordersById = new Map<string, Order>();
  private readonly orderNumbersByStore = new Map<string, Set<string>>();
  private transactionFailure: Error | null = null;
  private forceOrderNumberCollision = false;

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  /** Forces the next create attempt to hit a duplicate order number once. */
  forceNextOrderNumberCollision(): void {
    this.forceOrderNumberCollision = true;
  }

  getOrderCount(): number {
    return this.ordersById.size;
  }

  async findById(storeId: string, id: string): Promise<Order | null> {
    const order = this.ordersById.get(id);
    return order?.storeId === storeId ? order : null;
  }

  async list(query: ListOrdersQuery): Promise<CatalogueListResult<Order>> {
    let items = [...this.ordersById.values()].filter(
      (order) => order.storeId === query.storeId,
    );

    if (query.status) {
      items = items.filter((order) => order.status === query.status);
    }

    if (query.customerId) {
      items = items.filter((order) => order.customerId === query.customerId);
    }

    items.sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        left.id.localeCompare(right.id),
    );

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const paged = items.slice(start, start + query.limit);

    return buildCatalogueListResult({
      items: paged,
      total,
      page: query.page,
      limit: query.limit,
    });
  }

  async create(record: CreateOrderRecord): Promise<Order> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (this.transactionFailure) {
        throw this.transactionFailure;
      }

      let orderNumber = generateOrderNumber();

      if (this.forceOrderNumberCollision && attempt === 0) {
        const existing = this.ordersById.values().next().value as Order | undefined;
        if (existing) {
          orderNumber = existing.orderNumber;
        }
        this.forceOrderNumberCollision = false;
      }

      const storeNumbers =
        this.orderNumbersByStore.get(record.storeId) ?? new Set<string>();

      if (storeNumbers.has(orderNumber)) {
        continue;
      }

      const now = new Date().toISOString();
      const orderId = crypto.randomUUID();

      const items: OrderItem[] = record.items.map((item) => ({
        id: crypto.randomUUID(),
        orderId,
        productVariantId: item.productVariantId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        currency: item.currency,
        quantity: item.quantity,
        lineSubtotal: item.lineSubtotal,
        createdAt: now,
      }));

      const order: Order = {
        id: orderId,
        storeId: record.storeId,
        customerId: record.customerId,
        orderNumber,
        status: record.status,
        subtotal: record.subtotal,
        currency: record.currency,
        items,
        createdAt: now,
        updatedAt: now,
      };

      storeNumbers.add(orderNumber);
      this.orderNumbersByStore.set(record.storeId, storeNumbers);
      this.ordersById.set(order.id, order);
      return order;
    }

    throw new Error("Unable to generate a unique order number");
  }

  async transitionStatus(
    storeId: string,
    id: string,
    transition: OrderStatusTransitionInput,
  ): Promise<Order> {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const order = this.ordersById.get(id);

    if (!order || order.storeId !== storeId) {
      throw new Error(`Order not found: ${id}`);
    }

    if (order.status !== transition.fromStatus) {
      throw new Error(
        `Order transition rejected: ${order.status} -> ${transition.toStatus}`,
      );
    }

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      status: transition.toStatus,
      confirmedAt:
        transition.toStatus === "confirmed" ? now : order.confirmedAt,
      cancelledAt:
        transition.toStatus === "cancelled" ? now : order.cancelledAt,
      fulfilledAt:
        transition.toStatus === "fulfilled" ? now : order.fulfilledAt,
      updatedAt: now,
    };

    this.ordersById.set(id, updated);
    return updated;
  }
}
