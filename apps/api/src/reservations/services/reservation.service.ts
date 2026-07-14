import type { InventoryReservation } from "@commerceflow/types";
import type {
  ListOrderReservationsQuery,
  OrderReservationActionQuery,
  ReservationIdActionQuery,
} from "@commerceflow/validation";

import { getInventoryItemRepository } from "../../inventory/repositories";
import type { InventoryItemRepository } from "../../inventory/repositories/inventory-item.repository";
import { getOrderRepository } from "../../orders/repositories";
import type { OrderRepository } from "../../orders/repositories/order.repository";
import { RESERVATION_ERROR_CODES, ReservationError } from "../errors";
import {
  getInventoryReservationRepository,
  type InventoryReservationRepository,
} from "../repositories";
import { calculateAvailableQuantity } from "./reservation-stock";

export interface ReservationServiceDependencies {
  readonly inventoryReservationRepository?: InventoryReservationRepository;
  readonly orderRepository?: OrderRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
}

export class ReservationService {
  private readonly inventoryReservationRepository: InventoryReservationRepository;
  private readonly orderRepository: OrderRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;

  constructor(dependencies: ReservationServiceDependencies = {}) {
    this.inventoryReservationRepository =
      dependencies.inventoryReservationRepository ??
      getInventoryReservationRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
  }

  async reserveOrder(
    input: OrderReservationActionQuery,
    orderId: string,
  ): Promise<readonly InventoryReservation[]> {
    const order = await this.orderRepository.findById(input.storeId, orderId);

    if (!order) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    if (order.status !== "confirmed") {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.ORDER_NOT_CONFIRMED,
        "Only confirmed orders may reserve inventory",
        409,
      );
    }

    if (
      await this.inventoryReservationRepository.hasActiveReservationsForOrder(
        input.storeId,
        orderId,
      )
    ) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.ALREADY_RESERVED,
        "Order already has active inventory reservations",
        409,
      );
    }

    const pendingItems = [];

    for (const item of order.items) {
      const inventoryItem =
        await this.inventoryItemRepository.findByProductVariantId(
          input.storeId,
          item.productVariantId,
        );

      if (!inventoryItem) {
        throw new ReservationError(
          RESERVATION_ERROR_CODES.INVENTORY_NOT_FOUND,
          "Inventory item not found for order line",
          404,
        );
      }

      pendingItems.push({
        orderItemId: item.id,
        inventoryItemId: inventoryItem.id,
        reservedQuantity: item.quantity,
      });
    }

    try {
      return await this.inventoryReservationRepository.createForOrder({
        storeId: input.storeId,
        orderId,
        items: pendingItems,
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async releaseReservation(
    input: ReservationIdActionQuery,
    reservationId: string,
  ): Promise<InventoryReservation> {
    try {
      return await this.inventoryReservationRepository.release(
        input.storeId,
        reservationId,
      );
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async listOrderReservations(
    input: ListOrderReservationsQuery,
    orderId: string,
  ): Promise<readonly InventoryReservation[]> {
    const order = await this.orderRepository.findById(input.storeId, orderId);

    if (!order) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.ORDER_NOT_FOUND,
        "Order not found",
        404,
      );
    }

    return this.inventoryReservationRepository.listByOrderId(
      input.storeId,
      orderId,
    );
  }

  async getAvailableQuantity(
    storeId: string,
    inventoryItemId: string,
  ): Promise<number> {
    const inventoryItem = await this.inventoryItemRepository.findById(
      storeId,
      inventoryItemId,
    );

    if (!inventoryItem) {
      throw new ReservationError(
        RESERVATION_ERROR_CODES.INVENTORY_NOT_FOUND,
        "Inventory item not found",
        404,
      );
    }

    const activeReserved =
      await this.inventoryReservationRepository.getActiveReservedQuantity(
        storeId,
        inventoryItemId,
      );

    return calculateAvailableQuantity(
      inventoryItem.quantityOnHand,
      activeReserved,
    );
  }

  private mapRepositoryError(error: unknown): ReservationError {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message.includes("InventoryItem not found:")) {
      return new ReservationError(
        RESERVATION_ERROR_CODES.INVENTORY_NOT_FOUND,
        "Inventory item not found for order line",
        404,
      );
    }

    if (error.message === "INSUFFICIENT_AVAILABLE_STOCK") {
      return new ReservationError(
        RESERVATION_ERROR_CODES.INSUFFICIENT_STOCK,
        "Insufficient available stock for reservation",
        409,
      );
    }

    if (error.message === "ORDER_ALREADY_RESERVED") {
      return new ReservationError(
        RESERVATION_ERROR_CODES.ALREADY_RESERVED,
        "Order already has active inventory reservations",
        409,
      );
    }

    if (error.message.includes("Reservation not found:")) {
      return new ReservationError(
        RESERVATION_ERROR_CODES.NOT_FOUND,
        "Reservation not found",
        404,
      );
    }

    if (error.message === "RESERVATION_ALREADY_RELEASED") {
      return new ReservationError(
        RESERVATION_ERROR_CODES.ALREADY_RELEASED,
        "Reservation has already been released",
        409,
      );
    }

    throw error;
  }
}

export const reservationService = new ReservationService();
