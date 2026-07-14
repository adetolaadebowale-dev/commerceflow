import type { Order, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateOrderInput,
  ListOrdersQuery,
  OrderStoreActionQuery,
} from "@commerceflow/validation";

import { ORDER_ERROR_CODES, OrderError } from "../errors";
import { OrderStatusTransitionPolicy } from "../policies/order-status-transition.policy";
import type { PreparedOrderItem } from "../repositories";
import {
  getOrderRepository,
  getOrderVariantSnapshotReader,
  type OrderRepository,
  type OrderVariantSnapshotReader,
} from "../repositories";
import { multiplyPrice, sumPrices } from "./order-pricing";

export interface OrderServiceDependencies {
  readonly orderRepository?: OrderRepository;
  readonly orderVariantSnapshotReader?: OrderVariantSnapshotReader;
}

export class OrderService {
  private readonly orderRepository: OrderRepository;
  private readonly orderVariantSnapshotReader: OrderVariantSnapshotReader;

  constructor(dependencies: OrderServiceDependencies = {}) {
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.orderVariantSnapshotReader =
      dependencies.orderVariantSnapshotReader ??
      getOrderVariantSnapshotReader();
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const mergedItems = mergeOrderItems(input.items);
    const preparedItems: PreparedOrderItem[] = [];
    let orderCurrency: string | undefined;

    for (const item of mergedItems) {
      const snapshot = await this.orderVariantSnapshotReader.findVariantSnapshot(
        input.storeId,
        item.productVariantId,
      );

      if (!snapshot) {
        throw new OrderError(
          ORDER_ERROR_CODES.VARIANT_NOT_FOUND,
          "Product variant not found",
          404,
        );
      }

      if (!orderCurrency) {
        orderCurrency = snapshot.currency;
      } else if (orderCurrency !== snapshot.currency) {
        throw new OrderError(
          ORDER_ERROR_CODES.CURRENCY_MISMATCH,
          "All order items must use the same currency",
          400,
        );
      }

      preparedItems.push({
        productVariantId: snapshot.productVariantId,
        productName: snapshot.productName,
        sku: snapshot.sku,
        unitPrice: snapshot.unitPrice,
        currency: snapshot.currency,
        quantity: item.quantity,
        lineSubtotal: multiplyPrice(snapshot.unitPrice, item.quantity),
      });
    }

    const subtotal = sumPrices(preparedItems.map((item) => item.lineSubtotal));

    try {
      return await this.orderRepository.create({
        storeId: input.storeId,
        customerId: input.customerId,
        status: input.status,
        subtotal,
        currency: orderCurrency ?? "USD",
        items: preparedItems,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("unique order number")) {
        throw new OrderError(
          ORDER_ERROR_CODES.VALIDATION_ERROR,
          "Unable to generate a unique order number",
          409,
        );
      }

      throw error;
    }
  }

  async confirmOrder(input: OrderStoreActionQuery, id: string): Promise<Order> {
    return this.transitionOrder(input.storeId, id, "confirmed", "confirmed");
  }

  async cancelOrder(input: OrderStoreActionQuery, id: string): Promise<Order> {
    return this.transitionOrder(input.storeId, id, "cancelled", "cancelled");
  }

  async getOrder(storeId: string, id: string): Promise<Order> {
    const order = await this.orderRepository.findById(storeId, id);

    if (!order) {
      throw new OrderError(
        ORDER_ERROR_CODES.NOT_FOUND,
        "Order not found",
        404,
      );
    }

    return order;
  }

  async listOrders(query: ListOrdersQuery): Promise<CatalogueListResult<Order>> {
    return this.orderRepository.list(query);
  }

  private async transitionOrder(
    storeId: string,
    id: string,
    targetStatus: "confirmed" | "cancelled",
    actionLabel: "confirmed" | "cancelled",
  ): Promise<Order> {
    const order = await this.orderRepository.findById(storeId, id);

    if (!order) {
      throw new OrderError(
        ORDER_ERROR_CODES.NOT_FOUND,
        "Order not found",
        404,
      );
    }

    if (
      !OrderStatusTransitionPolicy.canTransition(order.status, targetStatus)
    ) {
      throw new OrderError(
        ORDER_ERROR_CODES.IMMUTABLE,
        `Order cannot be ${actionLabel} from its current status`,
        409,
      );
    }

    try {
      return await this.orderRepository.transitionStatus(storeId, id, {
        fromStatus: order.status,
        toStatus: targetStatus,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Order not found:")) {
        throw new OrderError(
          ORDER_ERROR_CODES.NOT_FOUND,
          "Order not found",
          404,
        );
      }

      if (
        error instanceof Error &&
        error.message.includes("Order transition rejected:")
      ) {
        throw new OrderError(
          ORDER_ERROR_CODES.IMMUTABLE,
          `Order cannot be ${actionLabel} from its current status`,
          409,
        );
      }

      throw error;
    }
  }
}

function mergeOrderItems(
  items: CreateOrderInput["items"],
): Array<{ productVariantId: string; quantity: number }> {
  const quantities = new Map<string, number>();

  for (const item of items) {
    quantities.set(
      item.productVariantId,
      (quantities.get(item.productVariantId) ?? 0) + item.quantity,
    );
  }

  return [...quantities.entries()].map(([productVariantId, quantity]) => ({
    productVariantId,
    quantity,
  }));
}

export const orderService = new OrderService();
