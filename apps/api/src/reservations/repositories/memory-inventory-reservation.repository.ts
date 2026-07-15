import type { InventoryReservation } from "@commerceflow/types";

import type { CreateOrderReservationsRecord } from "./create-order-reservations-record";
import type { InventoryReservationRepository } from "./inventory-reservation.repository";
import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import { hasAvailableStock } from "../services/reservation-stock";

export class MemoryInventoryReservationRepository
  implements InventoryReservationRepository
{
  private readonly reservationsById = new Map<string, InventoryReservation>();
  private transactionFailure: Error | null = null;

  constructor(
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  getReservationCount(): number {
    return this.reservationsById.size;
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<InventoryReservation | null> {
    const reservation = this.reservationsById.get(id);
    return reservation?.storeId === storeId ? reservation : null;
  }

  async listByOrderId(storeId: string, orderId: string) {
    return [...this.reservationsById.values()]
      .filter(
        (reservation) =>
          reservation.storeId === storeId && reservation.orderId === orderId,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async listByStoreId(storeId: string) {
    return [...this.reservationsById.values()]
      .filter((reservation) => reservation.storeId === storeId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async hasActiveReservationsForOrder(storeId: string, orderId: string) {
    return [...this.reservationsById.values()].some(
      (reservation) =>
        reservation.storeId === storeId &&
        reservation.orderId === orderId &&
        reservation.status === "active",
    );
  }

  async getActiveReservedQuantity(storeId: string, inventoryItemId: string) {
    return [...this.reservationsById.values()]
      .filter(
        (reservation) =>
          reservation.storeId === storeId &&
          reservation.inventoryItemId === inventoryItemId &&
          reservation.status === "active",
      )
      .reduce((total, reservation) => total + reservation.reservedQuantity, 0);
  }

  async createForOrder(record: CreateOrderReservationsRecord) {
    const existingActive = await this.hasActiveReservationsForOrder(
      record.storeId,
      record.orderId,
    );

    if (existingActive) {
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
      const inventoryItem = await this.inventoryItemRepository.findById(
        record.storeId,
        inventoryItemId,
      );

      if (!inventoryItem) {
        throw new Error(`InventoryItem not found: ${inventoryItemId}`);
      }

      const activeReservedQuantity = await this.getActiveReservedQuantity(
        record.storeId,
        inventoryItemId,
      );

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

    const now = new Date().toISOString();
    const created: InventoryReservation[] = record.items.map((item) => ({
      id: crypto.randomUUID(),
      storeId: record.storeId,
      orderId: record.orderId,
      orderItemId: item.orderItemId,
      inventoryItemId: item.inventoryItemId,
      reservedQuantity: item.reservedQuantity,
      status: "active",
      createdAt: now,
    }));

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    for (const reservation of created) {
      this.reservationsById.set(reservation.id, reservation);
    }

    return created;
  }

  async release(storeId: string, id: string) {
    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const reservation = this.reservationsById.get(id);

    if (!reservation || reservation.storeId !== storeId) {
      throw new Error(`Reservation not found: ${id}`);
    }

    if (reservation.status === "released") {
      throw new Error("RESERVATION_ALREADY_RELEASED");
    }

    if (reservation.status === "fulfilled") {
      throw new Error("RESERVATION_ALREADY_RELEASED");
    }

    const released: InventoryReservation = {
      ...reservation,
      status: "released",
      releasedAt: new Date().toISOString(),
    };

    this.reservationsById.set(id, released);
    return released;
  }

  markFulfilled(storeId: string, id: string): InventoryReservation {
    const reservation = this.reservationsById.get(id);

    if (!reservation || reservation.storeId !== storeId) {
      throw new Error(`Reservation not found: ${id}`);
    }

    const fulfilled: InventoryReservation = {
      ...reservation,
      status: "fulfilled",
      fulfilledAt: new Date().toISOString(),
    };

    this.reservationsById.set(id, fulfilled);
    return fulfilled;
  }
}
