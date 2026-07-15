import type { DomainEventPublisher } from "@/domain-events";
import { MemoryAuditLogRepository } from "@/audit/repositories/memory-audit-log.repository";
import { AuditService } from "@/audit/services/audit.service";
import { MemoryCycleCountRepository } from "@/cycle-counts/repositories/memory-cycle-count.repository";
import { CycleCountService } from "@/cycle-counts/services/cycle-count.service";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryShipmentFulfillmentModule,
  seedPackedShipmentWithAllocations,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "@/fulfillment/testing/fulfillment-test-utils";
import { MemoryInventoryAdjustmentRepository } from "@/inventory-adjustments/repositories/memory-inventory-adjustment.repository";
import { InventoryAdjustmentService } from "@/inventory-adjustments/services/inventory-adjustment.service";
import { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import { PurchaseOrderService } from "@/purchase-orders/services/purchase-order.service";
import { TEST_SUPPLIER_A_ID } from "@/purchase-orders/testing/purchase-order-test-utils";
import { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import { ReplenishmentService } from "@/replenishment/services/replenishment.service";
import { MemoryReturnRepository } from "@/returns/repositories/memory-return.repository";
import { ReturnService } from "@/returns/services/return.service";
import { MemorySupplierRepository } from "@/suppliers/repositories/memory-supplier.repository";
import { MemoryWarehouseTransferRepository } from "@/warehouse-transfers/repositories/memory-warehouse-transfer.repository";
import { WarehouseTransferService } from "@/warehouse-transfers/services/warehouse-transfer.service";
import { StaticOperationsContextProvider } from "../providers/static-operations-context.provider";
import { OperationalIntegrityService } from "../services/operational-integrity.service";

export {
  seedPackedShipmentWithAllocations,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_SUPPLIER_A_ID,
};

export type MemoryOperationsModule = ReturnType<
  typeof createMemoryOperationsModule
>;

export function createMemoryOperationsModule(
  options: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const eventing =
    options.domainEventPublisher !== undefined
      ? { domainEventPublisher: options.domainEventPublisher }
      : createTestDomainEventPublisher();

  const publisher =
    options.domainEventPublisher ??
    ("publisher" in eventing ? eventing.publisher : undefined);

  const fulfillmentModule = createMemoryShipmentFulfillmentModule({
    domainEventPublisher: publisher,
  });

  const supplierRepository = new MemorySupplierRepository();
  supplierRepository.seedSupplier({
    id: TEST_SUPPLIER_A_ID,
    storeId: TEST_STORE_A_ID,
    name: "Acme Supplies",
    code: "ACME",
    status: "active",
  });

  const purchaseOrderRepository = new MemoryPurchaseOrderRepository(
    fulfillmentModule.inventoryItemRepository,
  );
  const replenishmentRepository = new MemoryReplenishmentRepository(
    fulfillmentModule.inventoryItemRepository,
    purchaseOrderRepository,
  );
  const warehouseTransferRepository = new MemoryWarehouseTransferRepository(
    fulfillmentModule.inventoryItemRepository,
  );
  const returnRepository = new MemoryReturnRepository(
    fulfillmentModule.inventoryItemRepository,
  );
  const inventoryAdjustmentRepository = new MemoryInventoryAdjustmentRepository(
    fulfillmentModule.inventoryItemRepository,
  );
  const inventoryAdjustmentService = new InventoryAdjustmentService({
    inventoryAdjustmentRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    domainEventPublisher: publisher,
  });
  const cycleCountRepository = new MemoryCycleCountRepository(
    fulfillmentModule.inventoryItemRepository,
  );
  const cycleCountService = new CycleCountService({
    cycleCountRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    warehouseRepository: fulfillmentModule.warehouseRepository,
    domainEventPublisher: publisher,
  });
  const auditLogRepository = new MemoryAuditLogRepository();

  const purchaseOrderService = new PurchaseOrderService({
    purchaseOrderRepository,
    supplierRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    warehouseRepository: fulfillmentModule.warehouseRepository,
    domainEventPublisher: publisher,
  });
  const replenishmentService = new ReplenishmentService({
    replenishmentRepository,
    warehouseRepository: fulfillmentModule.warehouseRepository,
    supplierRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    domainEventPublisher: publisher,
  });
  const warehouseTransferService = new WarehouseTransferService({
    warehouseTransferRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    warehouseRepository: fulfillmentModule.warehouseRepository,
    domainEventPublisher: publisher,
  });
  const returnService = new ReturnService({
    returnRepository,
    orderRepository: fulfillmentModule.orderRepository,
    shipmentRepository: fulfillmentModule.shipmentRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    domainEventPublisher: publisher,
  });
  const contextProvider = new StaticOperationsContextProvider({
    warehouseRepository: fulfillmentModule.warehouseRepository,
    supplierRepository,
    shipmentRepository: fulfillmentModule.shipmentRepository,
    pickListRepository: fulfillmentModule.pickListRepository,
    inventoryAllocationRepository: fulfillmentModule.inventoryAllocationRepository,
    warehouseTransferRepository,
    purchaseOrderRepository,
    replenishmentRepository,
    inventoryItemRepository: fulfillmentModule.inventoryItemRepository,
    reservationRepository: fulfillmentModule.reservationRepository,
    returnRepository,
    cycleCountRepository,
    inventoryAdjustmentRepository,
  });
  const operationalIntegrityService = new OperationalIntegrityService({
    contextProvider,
    domainEventPublisher: publisher,
  });
  const auditService = new AuditService({ auditLogRepository });

  return {
    ...fulfillmentModule,
    supplierRepository,
    purchaseOrderRepository,
    purchaseOrderService,
    replenishmentRepository,
    replenishmentService,
    warehouseTransferRepository,
    warehouseTransferService,
    returnRepository,
    returnService,
    inventoryAdjustmentRepository,
    inventoryAdjustmentService,
    cycleCountRepository,
    cycleCountService,
    auditLogRepository,
    auditService,
    contextProvider,
    operationalIntegrityService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}
