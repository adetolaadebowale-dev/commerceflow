import type {
  InventoryItem,
  InventoryReservation,
  OrderFulfillmentResult,
  StockMovement,
} from "@commerceflow/types";

import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import type { MemoryOrderRepository } from "../../orders/repositories/memory-order.repository";
import type { MemoryInventoryReservationRepository } from "../../reservations/repositories/memory-inventory-reservation.repository";
import type { FulfillmentRepository } from "./fulfillment.repository";

export class MemoryFulfillmentRepository implements FulfillmentRepository {
  private transactionFailure: Error | null = null;

  constructor(
    private readonly orderRepository: MemoryOrderRepository,
    private readonly reservationRepository: MemoryInventoryReservationRepository,
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
  ) {}

  setTransactionFailure(error: Error | null): void {
    this.transactionFailure = error;
  }

  async fulfillOrder(
    storeId: string,
    orderId: string,
  ): Promise<OrderFulfillmentResult> {
    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    if (order.status === "fulfilled") {
      throw new Error("ORDER_ALREADY_FULFILLED");
    }

    if (order.status !== "confirmed") {
      throw new Error("ORDER_NOT_CONFIRMED");
    }

    const activeReservations = (
      await this.reservationRepository.listByOrderId(storeId, orderId)
    ).filter((reservation) => reservation.status === "active");

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

      if (!reservation || reservation.reservedQuantity !== item.quantity) {
        throw new Error("RESERVATION_MISMATCH");
      }
    }

    if (reservationByOrderItemId.size !== order.items.length) {
      throw new Error("RESERVATION_MISMATCH");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const fulfilledReservations: InventoryReservation[] = [];
    const stockMovements: StockMovement[] = [];
    const inventoryItems: InventoryItem[] = [];

    for (const reservation of activeReservations) {
      const deduction = await this.inventoryItemRepository.deductForFulfillment(
        storeId,
        reservation.inventoryItemId,
        reservation.reservedQuantity,
      );

      fulfilledReservations.push(
        this.reservationRepository.markFulfilled(storeId, reservation.id),
      );
      stockMovements.push(deduction.stockMovement);
      inventoryItems.push(deduction.inventoryItem);
    }

    const fulfilledOrder = await this.orderRepository.transitionStatus(
      storeId,
      orderId,
      { fromStatus: "confirmed", toStatus: "fulfilled" },
    );

    return {
      order: fulfilledOrder,
      reservations: fulfilledReservations,
      stockMovements,
      inventoryItems,
    };
  }
}
