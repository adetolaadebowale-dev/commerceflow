import type {
  CatalogueListResult,
  PurchaseOrder,
  PurchaseOrderReceiveResult,
} from "@commerceflow/types";
import type {
  CreatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
  PurchaseOrderIdQuery,
  PurchaseOrderLifecycleInput,
  ReceivePurchaseOrderInput,
} from "@commerceflow/validation";

import {
  getDomainEventPublisher,
  type DomainEventPublisher,
} from "@/domain-events";
import {
  getInventoryItemRepository,
  type InventoryItemRepository,
} from "@/inventory/repositories";
import {
  getWarehouseRepository,
  type WarehouseRepository,
} from "@/warehouses/repositories";
import {
  getSupplierRepository,
  type SupplierRepository,
} from "@/suppliers/repositories";
import { PURCHASE_ORDER_ERROR_CODES, PurchaseOrderError } from "../errors";
import { PurchaseOrderStatusTransitionPolicy } from "../policies/purchase-order-status-transition.policy";
import {
  getPurchaseOrderRepository,
  type PurchaseOrderRepository,
} from "../repositories";
import {
  generatePurchaseOrderNumber,
  isUniquePurchaseOrderNumberViolation,
} from "./purchase-order-number";

export interface PurchaseOrderServiceDependencies {
  readonly purchaseOrderRepository?: PurchaseOrderRepository;
  readonly supplierRepository?: SupplierRepository;
  readonly inventoryItemRepository?: InventoryItemRepository;
  readonly warehouseRepository?: WarehouseRepository;
  readonly domainEventPublisher?: DomainEventPublisher;
}

export class PurchaseOrderService {
  private readonly purchaseOrderRepository: PurchaseOrderRepository;
  private readonly supplierRepository: SupplierRepository;
  private readonly inventoryItemRepository: InventoryItemRepository;
  private readonly warehouseRepository: WarehouseRepository;
  private readonly domainEventPublisher: DomainEventPublisher;

  constructor(dependencies: PurchaseOrderServiceDependencies = {}) {
    this.purchaseOrderRepository =
      dependencies.purchaseOrderRepository ?? getPurchaseOrderRepository();
    this.supplierRepository =
      dependencies.supplierRepository ?? getSupplierRepository();
    this.inventoryItemRepository =
      dependencies.inventoryItemRepository ?? getInventoryItemRepository();
    this.warehouseRepository =
      dependencies.warehouseRepository ?? getWarehouseRepository();
    this.domainEventPublisher =
      dependencies.domainEventPublisher ?? getDomainEventPublisher();
  }

  async createPurchaseOrder(
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    await this.requireActiveWarehouse(input.storeId, input.warehouseId);
    await this.requireActiveSupplier(input.storeId, input.supplierId);

    const uniqueVariantIds = new Set<string>();
    const items: CreatePurchaseOrderInput["items"] = [];

    for (const item of input.items) {
      if (uniqueVariantIds.has(item.productVariantId)) {
        throw new PurchaseOrderError(
          PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
          "Duplicate product variants are not allowed",
          400,
        );
      }

      uniqueVariantIds.add(item.productVariantId);

      const variantExists = await this.inventoryItemRepository.productVariantExists(
        input.storeId,
        item.productVariantId,
      );

      if (!variantExists) {
        throw new PurchaseOrderError(
          PURCHASE_ORDER_ERROR_CODES.PRODUCT_VARIANT_NOT_FOUND,
          "Product variant not found",
          404,
        );
      }

      items.push(item);
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const purchaseOrder = await this.purchaseOrderRepository.create({
          storeId: input.storeId,
          warehouseId: input.warehouseId,
          supplierId: input.supplierId,
          purchaseOrderNumber: generatePurchaseOrderNumber(),
          expectedDeliveryDate: input.expectedDeliveryDate
            ? new Date(input.expectedDeliveryDate)
            : undefined,
          notes: input.notes,
          items,
        });

        this.domainEventPublisher.publishPurchaseOrderCreated(purchaseOrder);

        return purchaseOrder;
      } catch (error) {
        if (
          isUniquePurchaseOrderNumberViolation(error) &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }

        throw new PurchaseOrderError(
          PURCHASE_ORDER_ERROR_CODES.TRANSACTION_FAILED,
          "Failed to create purchase order",
          500,
        );
      }
    }

    throw new PurchaseOrderError(
      PURCHASE_ORDER_ERROR_CODES.TRANSACTION_FAILED,
      "Failed to create purchase order",
      500,
    );
  }

  async getPurchaseOrder(
    query: PurchaseOrderIdQuery,
    id: string,
  ): Promise<PurchaseOrder> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      query.storeId,
      id,
    );

    if (!purchaseOrder) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
        "Purchase order not found",
        404,
      );
    }

    return purchaseOrder;
  }

  async listPurchaseOrders(
    query: ListPurchaseOrdersQuery,
  ): Promise<CatalogueListResult<PurchaseOrder>> {
    return this.purchaseOrderRepository.list(query);
  }

  async approvePurchaseOrder(
    id: string,
    input: PurchaseOrderLifecycleInput,
  ): Promise<PurchaseOrder> {
    const existing = await this.requireMutablePurchaseOrder(input.storeId, id);

    if (
      !PurchaseOrderStatusTransitionPolicy.canTransition(existing.status, "approved")
    ) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid purchase order status transition",
        409,
      );
    }

    try {
      const purchaseOrder = await this.purchaseOrderRepository.approvePurchaseOrder(
        input.storeId,
        id,
        new Date(),
      );

      this.domainEventPublisher.publishPurchaseOrderApproved(purchaseOrder);

      return purchaseOrder;
    } catch (error) {
      return this.handleRepositoryError(error, "Failed to approve purchase order");
    }
  }

  async orderPurchaseOrder(
    id: string,
    input: PurchaseOrderLifecycleInput,
  ): Promise<PurchaseOrder> {
    const existing = await this.requireMutablePurchaseOrder(input.storeId, id);

    if (
      !PurchaseOrderStatusTransitionPolicy.canTransition(existing.status, "ordered")
    ) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid purchase order status transition",
        409,
      );
    }

    try {
      const purchaseOrder = await this.purchaseOrderRepository.orderPurchaseOrder(
        input.storeId,
        id,
        new Date(),
      );

      this.domainEventPublisher.publishPurchaseOrderOrdered(purchaseOrder);

      return purchaseOrder;
    } catch (error) {
      return this.handleRepositoryError(error, "Failed to order purchase order");
    }
  }

  async receivePurchaseOrder(
    id: string,
    input: ReceivePurchaseOrderInput,
  ): Promise<PurchaseOrderReceiveResult> {
    const existing = await this.purchaseOrderRepository.findById(
      input.storeId,
      id,
    );

    if (!existing) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
        "Purchase order not found",
        404,
      );
    }

    if (!PurchaseOrderStatusTransitionPolicy.canReceive(existing.status)) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid purchase order status transition",
        409,
      );
    }

    const previousStatus = existing.status;

    try {
      const result = await this.purchaseOrderRepository.receivePurchaseOrder(
        input.storeId,
        id,
        input,
        new Date(),
      );

      this.domainEventPublisher.publishPurchaseOrderReceived(result, previousStatus);

      return result;
    } catch (error) {
      return this.handleRepositoryError(error, "Failed to receive purchase order");
    }
  }

  async cancelPurchaseOrder(
    id: string,
    input: PurchaseOrderLifecycleInput,
  ): Promise<PurchaseOrder> {
    const existing = await this.purchaseOrderRepository.findById(
      input.storeId,
      id,
    );

    if (!existing) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
        "Purchase order not found",
        404,
      );
    }

    if (PurchaseOrderStatusTransitionPolicy.isTerminal(existing.status)) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_IMMUTABLE,
        "Purchase order is immutable",
        409,
      );
    }

    if (
      !PurchaseOrderStatusTransitionPolicy.canTransition(existing.status, "cancelled")
    ) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
        "Invalid purchase order status transition",
        409,
      );
    }

    const previousStatus = existing.status;

    try {
      const purchaseOrder = await this.purchaseOrderRepository.cancelPurchaseOrder(
        input.storeId,
        id,
      );

      this.domainEventPublisher.publishPurchaseOrderCancelled(
        purchaseOrder,
        previousStatus,
      );

      return purchaseOrder;
    } catch (error) {
      return this.handleRepositoryError(error, "Failed to cancel purchase order");
    }
  }

  private async requireMutablePurchaseOrder(
    storeId: string,
    id: string,
  ): Promise<PurchaseOrder> {
    const existing = await this.purchaseOrderRepository.findById(storeId, id);

    if (!existing) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
        "Purchase order not found",
        404,
      );
    }

    if (PurchaseOrderStatusTransitionPolicy.isImmutable(existing.status)) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.PURCHASE_ORDER_IMMUTABLE,
        "Purchase order is immutable",
        409,
      );
    }

    return existing;
  }

  private async requireActiveWarehouse(
    storeId: string,
    warehouseId: string,
  ): Promise<void> {
    const warehouse = await this.warehouseRepository.findById(storeId, warehouseId);

    if (!warehouse) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.WAREHOUSE_NOT_FOUND,
        "Warehouse not found",
        404,
      );
    }

    if (warehouse.status !== "active") {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Warehouse must be active",
        400,
      );
    }
  }

  private async requireActiveSupplier(
    storeId: string,
    supplierId: string,
  ): Promise<void> {
    const supplier = await this.supplierRepository.findById(storeId, supplierId);

    if (!supplier) {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.SUPPLIER_NOT_FOUND,
        "Supplier not found",
        404,
      );
    }

    if (supplier.status !== "active") {
      throw new PurchaseOrderError(
        PURCHASE_ORDER_ERROR_CODES.VALIDATION_ERROR,
        "Supplier must be active",
        400,
      );
    }
  }

  private handleRepositoryError(error: unknown, message: string): never {
    if (error instanceof Error) {
      if (error.message === "INVALID_STATUS_TRANSITION") {
        throw new PurchaseOrderError(
          PURCHASE_ORDER_ERROR_CODES.INVALID_STATUS_TRANSITION,
          "Invalid purchase order status transition",
          409,
        );
      }

      if (error.message === "RECEIPT_EXCEEDS_REMAINING") {
        throw new PurchaseOrderError(
          PURCHASE_ORDER_ERROR_CODES.RECEIPT_EXCEEDS_REMAINING,
          "Received quantity exceeds remaining ordered quantity",
          409,
        );
      }

      if (error.message === "ITEM_ALREADY_RECEIVED") {
        throw new PurchaseOrderError(
          PURCHASE_ORDER_ERROR_CODES.ITEM_ALREADY_RECEIVED,
          "Purchase order item is already fully received",
          409,
        );
      }
    }

    throw new PurchaseOrderError(
      PURCHASE_ORDER_ERROR_CODES.TRANSACTION_FAILED,
      message,
      500,
    );
  }
}

export const purchaseOrderService = new PurchaseOrderService();
