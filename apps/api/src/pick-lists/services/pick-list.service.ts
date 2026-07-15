import type { PickList, Shipment } from "@commerceflow/types";
import type {
  CreatePickListInput,
  PickListQuery,
  UpdatePickListInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import { getOrderRepository, type OrderRepository } from "@/orders/repositories";
import {
  getShipmentRepository,
  type ShipmentRepository,
} from "@/shipments/repositories";
import { PICK_LIST_ERROR_CODES, PickListError } from "../errors";
import { PickListStatusTransitionPolicy } from "../policies/pick-list-status-transition.policy";
import {
  getPickListRepository,
  type PickListRepository,
} from "../repositories";

export interface PickListServiceDependencies {
  readonly pickListRepository?: PickListRepository;
  readonly shipmentRepository?: ShipmentRepository;
  readonly orderRepository?: OrderRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class PickListService {
  private readonly pickListRepository: PickListRepository;
  private readonly shipmentRepository: ShipmentRepository;
  private readonly orderRepository: OrderRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: PickListServiceDependencies = {}) {
    this.pickListRepository =
      dependencies.pickListRepository ?? getPickListRepository();
    this.shipmentRepository =
      dependencies.shipmentRepository ?? getShipmentRepository();
    this.orderRepository =
      dependencies.orderRepository ?? getOrderRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createPickList(
    storeId: string,
    shipmentId: string,
    input: CreatePickListInput,
  ): Promise<PickList> {
    const shipment = await this.requireEligibleShipment(storeId, shipmentId);
    const activePickList = await this.pickListRepository.findActiveByShipmentId(
      storeId,
      shipmentId,
    );

    if (activePickList) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.ACTIVE_PICK_LIST_EXISTS,
        "Shipment already has an active pick list",
        409,
      );
    }

    const order = await this.orderRepository.findById(storeId, shipment.orderId);

    if (!order) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.SHIPMENT_NOT_FOUND,
        "Shipment order not found",
        404,
      );
    }

    if (order.items.length === 0) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.VALIDATION_ERROR,
        "Order has no items to pick",
        400,
      );
    }

    try {
      const pickList = await this.pickListRepository.create({
        storeId,
        shipmentId,
        assignedToUserId: input.assignedToUserId,
        items: order.items.map((item) => ({
          orderItemId: item.id,
          quantityRequired: item.quantity,
        })),
      });

      this.domainEventPublisher.publishPickListCreated(pickList);
      return pickList;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async listShipmentPickLists(
    query: PickListQuery,
    shipmentId: string,
  ): Promise<readonly PickList[]> {
    await this.requireShipment(query.storeId, shipmentId);

    return this.pickListRepository.listByShipmentId(query.storeId, shipmentId);
  }

  async getPickList(storeId: string, id: string): Promise<PickList> {
    const pickList = await this.pickListRepository.findById(storeId, id);

    if (!pickList) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.PICK_LIST_NOT_FOUND,
        "Pick list not found",
        404,
      );
    }

    return pickList;
  }

  async updatePickList(
    storeId: string,
    id: string,
    input: UpdatePickListInput,
  ): Promise<PickList> {
    const existing = await this.getPickList(storeId, id);
    this.assertPickListMutable(existing);

    if (input.items) {
      this.assertQuantitiesWithinRequired(existing, input);
    }

    try {
      return await this.pickListRepository.updateItems(storeId, id, input);
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async startPicking(storeId: string, id: string): Promise<PickList> {
    const existing = await this.getPickList(storeId, id);

    if (!PickListStatusTransitionPolicy.canTransition(existing.status, "picking")) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.INVALID_TRANSITION,
        "Pick list cannot be started from its current status",
        409,
      );
    }

    try {
      const pickList = await this.pickListRepository.transitionStatus(
        storeId,
        id,
        {
          status: "picking",
          startedAt: new Date(),
        },
      );

      this.domainEventPublisher.publishPickListStarted(pickList, "pending");
      return pickList;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async completePicking(
    storeId: string,
    id: string,
    input?: UpdatePickListInput,
  ): Promise<PickList> {
    const existing = await this.getPickList(storeId, id);

    if (!PickListStatusTransitionPolicy.canTransition(existing.status, "picked")) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.INVALID_TRANSITION,
        "Pick list cannot be completed from its current status",
        409,
      );
    }

    let current = existing;

    if (input?.items && input.items.length > 0) {
      current = await this.updatePickList(storeId, id, input);
    }

    this.assertFullyPicked(current);

    try {
      const pickList = await this.pickListRepository.transitionStatus(
        storeId,
        id,
        {
          status: "picked",
          completedAt: new Date(),
        },
      );

      this.domainEventPublisher.publishPickListCompleted(pickList, "picking");
      return pickList;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async markPacked(storeId: string, id: string): Promise<PickList> {
    const existing = await this.getPickList(storeId, id);

    if (existing.status !== "picked") {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.PICKING_NOT_COMPLETE,
        "Pick list must be picked before it can be marked packed",
        409,
      );
    }

    if (!PickListStatusTransitionPolicy.canTransition(existing.status, "packed")) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.INVALID_TRANSITION,
        "Pick list cannot be marked packed from its current status",
        409,
      );
    }

    this.assertFullyPicked(existing);

    try {
      const pickList = await this.pickListRepository.transitionStatus(
        storeId,
        id,
        { status: "packed" },
      );

      this.domainEventPublisher.publishPickListPacked(pickList, "picked");
      return pickList;
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private async requireShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findById(storeId, shipmentId);

    if (!shipment) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.SHIPMENT_NOT_FOUND,
        "Shipment not found",
        404,
      );
    }

    return shipment;
  }

  private async requireEligibleShipment(
    storeId: string,
    shipmentId: string,
  ): Promise<Shipment> {
    const shipment = await this.requireShipment(storeId, shipmentId);

    if (shipment.status === "delivered" || shipment.status === "cancelled") {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.SHIPMENT_NOT_ELIGIBLE,
        "Cannot create pick lists for delivered or cancelled shipments",
        409,
      );
    }

    return shipment;
  }

  private assertPickListMutable(pickList: PickList): void {
    if (pickList.status === "packed") {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.INVALID_TRANSITION,
        "Packed pick lists cannot be modified",
        409,
      );
    }
  }

  private assertQuantitiesWithinRequired(
    pickList: PickList,
    input: UpdatePickListInput,
  ): void {
    for (const itemUpdate of input.items ?? []) {
      const item = pickList.items.find(
        (entry) => entry.orderItemId === itemUpdate.orderItemId,
      );

      if (!item) {
        throw new PickListError(
          PICK_LIST_ERROR_CODES.ORDER_ITEM_NOT_FOUND,
          "Pick list item not found for order item",
          404,
        );
      }

      if (itemUpdate.quantityPicked > item.quantityRequired) {
        throw new PickListError(
          PICK_LIST_ERROR_CODES.QUANTITY_EXCEEDED,
          "Picked quantity cannot exceed required quantity",
          400,
        );
      }
    }
  }

  private assertFullyPicked(pickList: PickList): void {
    const incomplete = pickList.items.some(
      (item) => item.quantityPicked !== item.quantityRequired,
    );

    if (incomplete) {
      throw new PickListError(
        PICK_LIST_ERROR_CODES.INCOMPLETE_PICK,
        "All items must be fully picked before completing or packing",
        409,
      );
    }
  }

  private mapRepositoryError(error: unknown): PickListError {
    if (error instanceof PickListError) {
      return error;
    }

    if (error instanceof Error && error.message.startsWith("PickList not found:")) {
      return new PickListError(
        PICK_LIST_ERROR_CODES.PICK_LIST_NOT_FOUND,
        "Pick list not found",
        404,
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("PickListItem not found for order item:")
    ) {
      return new PickListError(
        PICK_LIST_ERROR_CODES.ORDER_ITEM_NOT_FOUND,
        "Pick list item not found for order item",
        404,
      );
    }

    return new PickListError(
      PICK_LIST_ERROR_CODES.TRANSACTION_FAILED,
      "Pick list transaction failed",
      500,
    );
  }
}

export const pickListService = new PickListService();
