import type {
  InventoryAllocation,
  InventoryItem,
  InventoryReservation,
  OrderFulfillmentResult,
  ShipmentFulfillmentResult,
  StockMovement,
} from "@commerceflow/types";

import type { MemoryInventoryAllocationRepository } from "../../inventory-allocation/repositories/memory-inventory-allocation.repository";
import type { MemoryInventoryItemRepository } from "../../inventory/repositories/memory-inventory-item.repository";
import type { MemoryPickListRepository } from "../../pick-lists/repositories/memory-pick-list.repository";
import type { MemoryOrderRepository } from "../../orders/repositories/memory-order.repository";
import type { MemoryInventoryReservationRepository } from "../../reservations/repositories/memory-inventory-reservation.repository";
import type { MemoryShipmentRepository } from "../../shipments/repositories/memory-shipment.repository";
import type { FulfillmentRepository } from "./fulfillment.repository";

export class MemoryFulfillmentRepository implements FulfillmentRepository {
  private transactionFailure: Error | null = null;

  constructor(
    private readonly orderRepository: MemoryOrderRepository,
    private readonly reservationRepository: MemoryInventoryReservationRepository,
    private readonly inventoryItemRepository: MemoryInventoryItemRepository,
    private readonly shipmentRepository?: MemoryShipmentRepository,
    private readonly pickListRepository?: MemoryPickListRepository,
    private readonly inventoryAllocationRepository?: MemoryInventoryAllocationRepository,
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

  async fulfillShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<ShipmentFulfillmentResult> {
    if (
      !this.shipmentRepository ||
      !this.pickListRepository ||
      !this.inventoryAllocationRepository
    ) {
      throw new Error("SHIPMENT_FULFILLMENT_NOT_CONFIGURED");
    }

    const shipment = await this.shipmentRepository.findById(storeId, shipmentId);

    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }

    if (shipment.fulfilledAt) {
      throw new Error("SHIPMENT_ALREADY_FULFILLED");
    }

    if (this.transactionFailure) {
      throw this.transactionFailure;
    }

    const pickLists = await this.pickListRepository.listByShipmentId(
      storeId,
      shipmentId,
    );
    const pickList = pickLists.find((entry) => entry.status === "packed");

    if (!pickList) {
      throw new Error("PICK_LIST_NOT_PACKED");
    }

    const allocations: InventoryAllocation[] = [];
    const stockMovements: StockMovement[] = [];
    const inventoryItems: InventoryItem[] = [];

    for (const item of pickList.items) {
      const itemAllocations =
        await this.inventoryAllocationRepository.listByPickListItemId(
          storeId,
          item.id,
        );

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

        const deduction =
          await this.inventoryItemRepository.deductForShipmentFulfillment(
            storeId,
            allocation.inventoryItemId,
            allocation.quantityPicked,
            {
              shipmentId,
              inventoryAllocationId: allocation.id,
              reference: shipment.shipmentNumber,
            },
          );

        const fulfilledAllocation =
          await this.inventoryAllocationRepository.markFulfilled(
            storeId,
            allocation.id,
          );

        allocations.push(fulfilledAllocation);
        stockMovements.push(deduction.stockMovement);
        inventoryItems.push(deduction.inventoryItem);
      }
    }

    const fulfilledShipment =
      await this.shipmentRepository.markWarehouseFulfilled(
        storeId,
        shipmentId,
      );

    return {
      shipment: fulfilledShipment,
      stockMovements,
      inventoryItems,
      allocations,
    };
  }
}
