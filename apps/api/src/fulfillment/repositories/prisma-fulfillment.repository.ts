import {
  type PrismaClient,
  type InventoryItem as PrismaInventoryItem,
  type InventoryReservation as PrismaInventoryReservation,
  type Order as PrismaOrder,
  type OrderItem as PrismaOrderItem,
  type StockMovement as PrismaStockMovement,
} from "@prisma/client";
import type {
  InventoryItem,
  InventoryReservation,
  Order,
  OrderFulfillmentResult,
  OrderItem,
  StockMovement,
} from "@commerceflow/types";

import type { FulfillmentRepository } from "./fulfillment.repository";

type OrderWithItems = PrismaOrder & {
  items: PrismaOrderItem[];
};

const itemsInclude = {
  orderBy: { createdAt: "asc" as const },
};

function toOrderItem(record: PrismaOrderItem): OrderItem {
  return {
    id: record.id,
    orderId: record.orderId,
    productVariantId: record.productVariantId,
    productName: record.productName,
    sku: record.sku,
    unitPrice: record.unitPrice.toString(),
    currency: record.currency,
    quantity: record.quantity,
    lineSubtotal: record.lineSubtotal.toString(),
    createdAt: record.createdAt.toISOString(),
  };
}

function toOrder(record: OrderWithItems): Order {
  return {
    id: record.id,
    storeId: record.storeId,
    customerId: record.customerId ?? undefined,
    orderNumber: record.orderNumber,
    status: record.status,
    subtotal: record.subtotal.toString(),
    currency: record.currency,
    items: record.items.map(toOrderItem),
    confirmedAt: record.confirmedAt?.toISOString(),
    cancelledAt: record.cancelledAt?.toISOString(),
    fulfilledAt: record.fulfilledAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toInventoryReservation(
  record: PrismaInventoryReservation,
): InventoryReservation {
  return {
    id: record.id,
    storeId: record.storeId,
    orderId: record.orderId,
    orderItemId: record.orderItemId,
    inventoryItemId: record.inventoryItemId,
    reservedQuantity: record.reservedQuantity,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    releasedAt: record.releasedAt?.toISOString(),
    fulfilledAt: record.fulfilledAt?.toISOString(),
  };
}

function toInventoryItem(record: PrismaInventoryItem): InventoryItem {
  return {
    id: record.id,
    storeId: record.storeId,
    productVariantId: record.productVariantId,
    quantityOnHand: record.quantityOnHand,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toStockMovement(record: PrismaStockMovement): StockMovement {
  return {
    id: record.id,
    storeId: record.storeId,
    inventoryItemId: record.inventoryItemId,
    productVariantId: record.productVariantId,
    quantityChange: record.quantityChange,
    quantityAfter: record.quantityAfter,
    reason: record.reason,
    createdAt: record.createdAt.toISOString(),
  };
}

export class PrismaFulfillmentRepository implements FulfillmentRepository {
  constructor(private readonly db: PrismaClient) {}

  async fulfillOrder(
    storeId: string,
    orderId: string,
  ): Promise<OrderFulfillmentResult> {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, storeId },
        include: { items: itemsInclude },
      });

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      if (order.status === "fulfilled") {
        throw new Error("ORDER_ALREADY_FULFILLED");
      }

      if (order.status !== "confirmed") {
        throw new Error("ORDER_NOT_CONFIRMED");
      }

      const activeReservations = await tx.inventoryReservation.findMany({
        where: { storeId, orderId, status: "active" },
        orderBy: { createdAt: "asc" },
      });

      if (activeReservations.length === 0) {
        throw new Error("NO_ACTIVE_RESERVATIONS");
      }

      const reservationByOrderItemId = new Map(
        activeReservations.map((reservation) => [
          reservation.orderItemId,
          reservation,
        ]),
      );

      for (const item of order.items) {
        const reservation = reservationByOrderItemId.get(item.id);

        if (!reservation) {
          throw new Error("RESERVATION_MISMATCH");
        }

        if (reservation.reservedQuantity !== item.quantity) {
          throw new Error("INSUFFICIENT_RESERVED_STOCK");
        }
      }

      if (reservationByOrderItemId.size !== order.items.length) {
        throw new Error("RESERVATION_MISMATCH");
      }

      const now = new Date();
      const fulfilledReservations: InventoryReservation[] = [];
      const stockMovements: StockMovement[] = [];
      const inventoryItems: InventoryItem[] = [];

      for (const reservation of activeReservations) {
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            id: reservation.inventoryItemId,
            storeId,
            deletedAt: null,
          },
        });

        if (!inventoryItem) {
          throw new Error("INSUFFICIENT_RESERVED_STOCK");
        }

        if (inventoryItem.quantityOnHand < reservation.reservedQuantity) {
          throw new Error("INSUFFICIENT_RESERVED_STOCK");
        }

        const quantityAfter =
          inventoryItem.quantityOnHand - reservation.reservedQuantity;

        const updatedInventoryItem = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantityOnHand: quantityAfter },
        });

        const stockMovement = await tx.stockMovement.create({
          data: {
            storeId,
            inventoryItemId: inventoryItem.id,
            productVariantId: inventoryItem.productVariantId,
            quantityChange: -reservation.reservedQuantity,
            quantityAfter,
            reason: "sale_fulfilled",
          },
        });

        const updatedReservation = await tx.inventoryReservation.update({
          where: { id: reservation.id },
          data: {
            status: "fulfilled",
            fulfilledAt: now,
          },
        });

        fulfilledReservations.push(toInventoryReservation(updatedReservation));
        stockMovements.push(toStockMovement(stockMovement));
        inventoryItems.push(toInventoryItem(updatedInventoryItem));
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "fulfilled",
          fulfilledAt: now,
        },
        include: { items: itemsInclude },
      });

      return {
        order: toOrder(updatedOrder),
        reservations: fulfilledReservations,
        stockMovements,
        inventoryItems,
      };
    });
  }
}
