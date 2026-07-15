import type { InventoryAllocation, Shipment } from "@commerceflow/types";
import type {
  AllocateInventoryInput,
  ReportShortageInput,
  UpdateInventoryAllocationInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getInventoryItemRepository,
  type InventoryItemRepository,
} from "@/inventory/repositories";
import { getOrderRepository, type OrderRepository } from "@/orders/repositories";
import {
  getInventoryReservationRepository,
  type InventoryReservationRepository,
} from "@/reservations/repositories";
import {
  getPickListRepository,
  type PickListItemContext,
  type PickListRepository,
} from "@/pick-lists/repositories";
import {
  getShipmentRepository,
  type ShipmentRepository,
} from "@/shipments/repositories";
import {
  INVENTORY_ALLOCATION_ERROR_CODES,
  InventoryAllocationError,
} from "../errors";
import { InventoryAllocationStatusPolicy } from "../policies/inventory-allocation-status.policy";
import {
  getInventoryAllocationRepository,
  type InventoryAllocationRepository,
} from "../repositories";
import {
  calculateAllocatableQuantity,
  sumActiveAllocationHold,
} from "./allocation-availability";

export interface InventoryAllocationServiceDependencies {
  readonly inventoryAllocationRepository?: InventoryAllocationRepository;
  readonly pickListRepository?: PickListRepository;
  readonly shipmentRepository?: ShipmentRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly inventoryReservationRepository?: InventoryReservationRepository;
  readonly orderRepository?: OrderRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class InventoryAllocationService {
  private readonly inventoryAllocationRepository: InventoryAllocationRepository;
  private readonly pickListRepository: PickListRepository;
  private readonly shipmentRepository: ShipmentRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly inventoryReservationRepository: InventoryReservationRepository;
  private readonly orderRepository: OrderRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: InventoryAllocationServiceDependencies = {}) {
    this.inventoryAllocationRepository =
      dependencies.inventoryAllocationRepository ??
      getInventoryAllocationRepository();
    this.pickListRepository =
      dependencies.pickListRepository ?? getPickListRepository();
    this.shipmentRepository =
      dependencies.shipmentRepository ?? getShipmentRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.inventoryReservationRepository =
      dependencies.inventoryReservationRepository ??
      getInventoryReservationRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async allocateInventory(
    storeId: string,
    pickListItemId: string,
    input: AllocateInventoryInput,
  ): Promise<InventoryAllocation> {
    const { context, shipment } = await this.requireMutablePickListItem(
      storeId,
      pickListItemId,
    );

    await this.assertInventoryVariantMatch(
      storeId,
      shipment.orderId,
      context.item.orderItemId,
      input.inventoryItemId,
    );

    const inventoryItem = await this.inventoryItemRepository.findById(
      storeId,
      input.inventoryItemId,
    );

    if (!inventoryItem) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.INVENTORY_NOT_FOUND,
        "Inventory item not found",
        404,
      );
    }

    const existingItemAllocations =
      await this.inventoryAllocationRepository.listByPickListItemId(
        storeId,
        pickListItemId,
      );
    const allocatedOnItem = existingItemAllocations.reduce(
      (total, allocation) => total + allocation.quantityAllocated,
      0,
    );

    if (
      allocatedOnItem + input.quantityAllocated >
      context.item.quantityRequired
    ) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.QUANTITY_EXCEEDED,
        "Allocation quantity exceeds pick list item requirement",
        400,
      );
    }

    const inventoryAllocations =
      await this.inventoryAllocationRepository.listByInventoryItemId(
        storeId,
        input.inventoryItemId,
      );
    const activeHold = sumActiveAllocationHold(inventoryAllocations);
    const activeReserved =
      await this.inventoryReservationRepository.getActiveReservedQuantity(
        storeId,
        input.inventoryItemId,
      );
    const available = calculateAllocatableQuantity(
      inventoryItem.quantityOnHand,
      activeReserved,
      activeHold,
    );

    if (input.quantityAllocated > available) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.INSUFFICIENT_INVENTORY,
        "Insufficient available inventory for allocation",
        409,
      );
    }

    try {
      const allocation = await this.inventoryAllocationRepository.create({
        storeId,
        warehouseId: inventoryItem.warehouseId,
        pickListItemId,
        inventoryItemId: input.inventoryItemId,
        quantityAllocated: input.quantityAllocated,
      });

      this.domainEventPublisher.publishInventoryAllocated(allocation);
      return allocation;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updatePickedQuantity(
    storeId: string,
    id: string,
    input: UpdateInventoryAllocationInput,
  ): Promise<InventoryAllocation> {
    const existing = await this.getAllocation(storeId, id);
    await this.requireMutablePickListItem(storeId, existing.pickListItemId);
    this.assertAllocationMutable(existing);

    if (input.quantityPicked > existing.quantityAllocated) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.QUANTITY_EXCEEDED,
        "Picked quantity cannot exceed allocated quantity",
        400,
      );
    }

    const previousStatus = existing.status;
    const nextStatus = InventoryAllocationStatusPolicy.deriveStatus(
      existing.quantityAllocated,
      input.quantityPicked,
    );

    try {
      const updated = await this.inventoryAllocationRepository.updatePickedQuantity(
        storeId,
        id,
        {
          quantityPicked: input.quantityPicked,
          status: nextStatus,
        },
      );

      await this.syncPickListItemQuantityPicked(storeId, updated.pickListItemId);
      this.publishPickedQuantityEvent(updated, previousStatus);
      return updated;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async reportShortage(
    storeId: string,
    id: string,
    input: ReportShortageInput,
  ): Promise<InventoryAllocation> {
    const existing = await this.getAllocation(storeId, id);
    await this.requireMutablePickListItem(storeId, existing.pickListItemId);
    this.assertAllocationMutable(existing);

    try {
      const updated = await this.inventoryAllocationRepository.reportShortage(
        storeId,
        id,
        { shortageReason: input.shortageReason },
      );

      await this.syncPickListItemQuantityPicked(storeId, updated.pickListItemId);
      this.domainEventPublisher.publishInventoryShortageReported(
        updated,
        existing.status,
      );
      return updated;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async getAllocation(storeId: string, id: string): Promise<InventoryAllocation> {
    const allocation = await this.inventoryAllocationRepository.findById(
      storeId,
      id,
    );

    if (!allocation) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.ALLOCATION_NOT_FOUND,
        "Inventory allocation not found",
        404,
      );
    }

    return allocation;
  }

  private async requireMutablePickListItem(
    storeId: string,
    pickListItemId: string,
  ): Promise<{ context: PickListItemContext; shipment: Shipment }> {
    const context = await this.pickListRepository.findItemById(
      storeId,
      pickListItemId,
    );

    if (!context) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.PICK_LIST_ITEM_NOT_FOUND,
        "Pick list item not found",
        404,
      );
    }

    if (context.pickList.status === "packed") {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.PICK_LIST_NOT_MUTABLE,
        "Packed pick lists cannot be modified",
        409,
      );
    }

    const shipment = await this.shipmentRepository.findById(
      storeId,
      context.pickList.shipmentId,
    );

    if (!shipment) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.SHIPMENT_NOT_ELIGIBLE,
        "Shipment not found",
        404,
      );
    }

    if (shipment.status === "delivered" || shipment.status === "cancelled") {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.SHIPMENT_NOT_ELIGIBLE,
        "Delivered or cancelled shipments are immutable",
        409,
      );
    }

    return { context, shipment };
  }

  private async assertInventoryVariantMatch(
    storeId: string,
    orderId: string,
    orderItemId: string,
    inventoryItemId: string,
  ): Promise<void> {
    const inventoryItem = await this.inventoryItemRepository.findById(
      storeId,
      inventoryItemId,
    );

    if (!inventoryItem) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.INVENTORY_NOT_FOUND,
        "Inventory item not found",
        404,
      );
    }

    const order = await this.orderRepository.findById(storeId, orderId);

    if (!order) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.ORDER_ITEM_NOT_FOUND,
        "Order item not found",
        404,
      );
    }

    const orderItem = order.items.find((item) => item.id === orderItemId);

    if (!orderItem) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.ORDER_ITEM_NOT_FOUND,
        "Order item not found",
        404,
      );
    }

    if (orderItem.productVariantId !== inventoryItem.productVariantId) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.VARIANT_MISMATCH,
        "Inventory item variant does not match pick list order line",
        400,
      );
    }
  }

  private assertAllocationMutable(allocation: InventoryAllocation): void {
    if (!InventoryAllocationStatusPolicy.isMutable(allocation.status)) {
      throw new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.ALLOCATION_IMMUTABLE,
        "Allocation cannot be modified in its current status",
        409,
      );
    }
  }

  private async syncPickListItemQuantityPicked(
    storeId: string,
    pickListItemId: string,
  ): Promise<void> {
    const allocations =
      await this.inventoryAllocationRepository.listByPickListItemId(
        storeId,
        pickListItemId,
      );
    const quantityPicked = allocations.reduce(
      (total, allocation) => total + allocation.quantityPicked,
      0,
    );

    await this.pickListRepository.syncItemQuantityPicked(
      storeId,
      pickListItemId,
      quantityPicked,
    );
  }

  private publishPickedQuantityEvent(
    allocation: InventoryAllocation,
    previousStatus: InventoryAllocation["status"],
  ): void {
    if (allocation.status === "picked") {
      this.domainEventPublisher.publishInventoryPicked(allocation, previousStatus);
      return;
    }

    if (allocation.status === "partially_picked") {
      this.domainEventPublisher.publishInventoryPartiallyPicked(
        allocation,
        previousStatus,
      );
    }
  }

  private mapRepositoryError(error: unknown): InventoryAllocationError {
    if (error instanceof InventoryAllocationError) {
      return error;
    }

    if (
      error instanceof Error &&
      error.message.startsWith("InventoryAllocation not found:")
    ) {
      return new InventoryAllocationError(
        INVENTORY_ALLOCATION_ERROR_CODES.ALLOCATION_NOT_FOUND,
        "Inventory allocation not found",
        404,
      );
    }

    return new InventoryAllocationError(
      INVENTORY_ALLOCATION_ERROR_CODES.TRANSACTION_FAILED,
      "Inventory allocation transaction failed",
      500,
    );
  }
}

export const inventoryAllocationService = new InventoryAllocationService();
