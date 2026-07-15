import {
  type PrismaClient,
  type InventoryReservation as PrismaInventoryReservation,
} from "@prisma/client";
import type { InventoryReservation } from "@commerceflow/types";

import type { CreateOrderReservationsRecord } from "./create-order-reservations-record";
import type { InventoryReservationRepository } from "./inventory-reservation.repository";
import { hasAvailableStock } from "../services/reservation-stock";

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

export class PrismaInventoryReservationRepository
  implements InventoryReservationRepository
{
  constructor(private readonly db: PrismaClient) {}

  async findById(
    storeId: string,
    id: string,
  ): Promise<InventoryReservation | null> {
    const record = await this.db.inventoryReservation.findFirst({
      where: { id, storeId },
    });

    return record ? toInventoryReservation(record) : null;
  }

  async listByOrderId(storeId: string, orderId: string) {
    const records = await this.db.inventoryReservation.findMany({
      where: { storeId, orderId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toInventoryReservation);
  }

  async listByStoreId(storeId: string) {
    const records = await this.db.inventoryReservation.findMany({
      where: { storeId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toInventoryReservation);
  }

  async hasActiveReservationsForOrder(storeId: string, orderId: string) {
    const count = await this.db.inventoryReservation.count({
      where: { storeId, orderId, status: "active" },
    });

    return count > 0;
  }

  async getActiveReservedQuantity(storeId: string, inventoryItemId: string) {
    const aggregate = await this.db.inventoryReservation.aggregate({
      where: {
        storeId,
        inventoryItemId,
        status: "active",
      },
      _sum: { reservedQuantity: true },
    });

    return aggregate._sum.reservedQuantity ?? 0;
  }

  async createForOrder(record: CreateOrderReservationsRecord) {
    return this.db.$transaction(async (tx) => {
      const existingActiveCount = await tx.inventoryReservation.count({
        where: {
          storeId: record.storeId,
          orderId: record.orderId,
          status: "active",
        },
      });

      if (existingActiveCount > 0) {
        throw new Error("ORDER_ALREADY_RESERVED");
      }

      const requestedByInventoryItem = new Map<string, number>();

      for (const item of record.items) {
        requestedByInventoryItem.set(
          item.inventoryItemId,
          (requestedByInventoryItem.get(item.inventoryItemId) ?? 0) +
            item.reservedQuantity,
        );
      }

      for (const [inventoryItemId, requestedQuantity] of requestedByInventoryItem) {
        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            id: inventoryItemId,
            storeId: record.storeId,
            deletedAt: null,
          },
        });

        if (!inventoryItem) {
          throw new Error(`InventoryItem not found: ${inventoryItemId}`);
        }

        const activeReserved = await tx.inventoryReservation.aggregate({
          where: {
            storeId: record.storeId,
            inventoryItemId,
            status: "active",
          },
          _sum: { reservedQuantity: true },
        });

        const activeReservedQuantity = activeReserved._sum.reservedQuantity ?? 0;

        if (
          !hasAvailableStock(
            inventoryItem.quantityOnHand,
            activeReservedQuantity,
            requestedQuantity,
          )
        ) {
          throw new Error("INSUFFICIENT_AVAILABLE_STOCK");
        }
      }

      const created = await Promise.all(
        record.items.map((item) =>
          tx.inventoryReservation.create({
            data: {
              storeId: record.storeId,
              orderId: record.orderId,
              orderItemId: item.orderItemId,
              inventoryItemId: item.inventoryItemId,
              reservedQuantity: item.reservedQuantity,
              status: "active",
            },
          }),
        ),
      );

      return created.map(toInventoryReservation);
    });
  }

  async release(storeId: string, id: string) {
    return this.db.$transaction(async (tx) => {
      const updated = await tx.inventoryReservation.updateMany({
        where: { id, storeId, status: "active" },
        data: {
          status: "released",
          releasedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        const existing = await tx.inventoryReservation.findFirst({
          where: { id, storeId },
          select: { status: true },
        });

        if (!existing) {
          throw new Error(`Reservation not found: ${id}`);
        }

        throw new Error("RESERVATION_ALREADY_RELEASED");
      }

      const record = await tx.inventoryReservation.findFirstOrThrow({
        where: { id, storeId },
      });

      return toInventoryReservation(record);
    });
  }
}
