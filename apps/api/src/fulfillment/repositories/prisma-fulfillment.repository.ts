import {
  type InventoryAllocation as PrismaInventoryAllocation,
  type InventoryItem as PrismaInventoryItem,
  type InventoryReservation as PrismaInventoryReservation,
  type Order as PrismaOrder,
  type OrderItem as PrismaOrderItem,
  type PrismaClient,
  type Shipment as PrismaShipment,
} from "@prisma/client";
import type {
  InventoryAllocation,
  InventoryItem,
  InventoryReservation,
  Order,
  OrderFulfillmentResult,
  OrderItem,
  Shipment,
  ShipmentFulfillmentResult,
  StockMovement,
} from "@commerceflow/types";

import { toStockMovement } from "@/lib/stock-movement-mapper";
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
    discountAmount: record.discountAmount?.toString(),
    total: record.total.toString(),
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

function toShipment(record: PrismaShipment): Shipment {
  return {
    id: record.id,
    storeId: record.storeId,
    orderId: record.orderId,
    shipmentNumber: record.shipmentNumber,
    carrier: record.carrier,
    trackingNumber: record.trackingNumber ?? undefined,
    shippingRecipientName: record.shippingRecipientName,
    shippingPhone: record.shippingPhone,
    shippingAddressLine1: record.shippingAddressLine1,
    shippingAddressLine2: record.shippingAddressLine2 ?? undefined,
    shippingCity: record.shippingCity,
    shippingStateProvince: record.shippingStateProvince,
    shippingPostalCode: record.shippingPostalCode,
    shippingCountryCode: record.shippingCountryCode,
    status: record.status,
    shippedAt: record.shippedAt?.toISOString(),
    deliveredAt: record.deliveredAt?.toISOString(),
    fulfilledAt: record.fulfilledAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toInventoryAllocation(
  record: PrismaInventoryAllocation,
): InventoryAllocation {
  return {
    id: record.id,
    storeId: record.storeId,
    pickListItemId: record.pickListItemId,
    inventoryItemId: record.inventoryItemId,
    quantityAllocated: record.quantityAllocated,
    quantityPicked: record.quantityPicked,
    status: record.status,
    shortageReason: record.shortageReason ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
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

        const newQuantityOnHand =
          inventoryItem.quantityOnHand - reservation.reservedQuantity;

        const updatedInventoryItem = await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantityOnHand: newQuantityOnHand },
        });

        const stockMovement = await tx.stockMovement.create({
          data: {
            storeId,
            inventoryItemId: inventoryItem.id,
            movementType: "fulfillment",
            quantity: -reservation.reservedQuantity,
            previousQuantityOnHand: inventoryItem.quantityOnHand,
            newQuantityOnHand,
            reference: order.orderNumber,
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

  async fulfillShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<ShipmentFulfillmentResult> {
    return this.db.$transaction(async (tx) => {
      const shipment = await tx.shipment.findFirst({
        where: { id: shipmentId, storeId },
      });

      if (!shipment) {
        throw new Error(`Shipment not found: ${shipmentId}`);
      }

      if (shipment.fulfilledAt) {
        throw new Error("SHIPMENT_ALREADY_FULFILLED");
      }

      const pickList = await tx.pickList.findFirst({
        where: { storeId, shipmentId, status: "packed" },
        include: {
          items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        },
      });

      if (!pickList) {
        throw new Error("PICK_LIST_NOT_PACKED");
      }

      const allocations: InventoryAllocation[] = [];
      const stockMovements: StockMovement[] = [];
      const inventoryItems: InventoryItem[] = [];
      const now = new Date();

      for (const item of pickList.items) {
        const itemAllocations = await tx.inventoryAllocation.findMany({
          where: { storeId, pickListItemId: item.id },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });

        if (itemAllocations.length === 0) {
          throw new Error("INCOMPLETE_ALLOCATIONS");
        }

        const pickedQuantity = itemAllocations.reduce(
          (total, allocation) => total + allocation.quantityPicked,
          0,
        );

        if (pickedQuantity !== item.quantityRequired) {
          throw new Error("INCOMPLETE_ALLOCATIONS");
        }

        for (const allocation of itemAllocations) {
          if (allocation.status !== "picked") {
            throw new Error("INCOMPLETE_ALLOCATIONS");
          }

          const inventoryItem = await tx.inventoryItem.findFirst({
            where: {
              id: allocation.inventoryItemId,
              storeId,
              deletedAt: null,
            },
          });

          if (!inventoryItem) {
            throw new Error("INSUFFICIENT_STOCK");
          }

          if (inventoryItem.quantityOnHand < allocation.quantityPicked) {
            throw new Error("INSUFFICIENT_STOCK");
          }

          const newQuantityOnHand =
            inventoryItem.quantityOnHand - allocation.quantityPicked;

          const updatedInventoryItem = await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantityOnHand: newQuantityOnHand },
          });

          const stockMovement = await tx.stockMovement.create({
            data: {
              storeId,
              inventoryItemId: inventoryItem.id,
              shipmentId,
              inventoryAllocationId: allocation.id,
              movementType: "fulfillment",
              quantity: -allocation.quantityPicked,
              previousQuantityOnHand: inventoryItem.quantityOnHand,
              newQuantityOnHand,
              reference: shipment.shipmentNumber,
            },
          });

          const updatedAllocation = await tx.inventoryAllocation.update({
            where: { id: allocation.id },
            data: { status: "fulfilled" },
          });

          allocations.push(toInventoryAllocation(updatedAllocation));
          stockMovements.push(toStockMovement(stockMovement));
          inventoryItems.push(toInventoryItem(updatedInventoryItem));
        }
      }

      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId, storeId },
        data: { fulfilledAt: now },
      });

      return {
        shipment: toShipment(updatedShipment),
        stockMovements,
        inventoryItems,
        allocations,
      };
    });
  }
}
