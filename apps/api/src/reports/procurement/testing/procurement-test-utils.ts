import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { MemorySupplierRepository } from "@/suppliers/repositories/memory-supplier.repository";
import { MemoryWarehouseRepository } from "@/warehouses/repositories/memory-warehouse.repository";
import { MemoryWarehouseTransferRepository } from "@/warehouse-transfers/repositories/memory-warehouse-transfer.repository";
import { MemoryReportFoundationRepository } from "../../repositories/memory-report-foundation.repository";
import { MemoryProcurementReportRepository } from "../repositories/memory-procurement-report.repository";
import { ProcurementReportsService } from "../services/procurement-reports.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "../../testing/reports-test-utils";

export const TEST_SUPPLIER_A_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
export const TEST_VARIANT_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

export function createMemoryProcurementReportsModule(
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

  const inventoryItemRepository = new MemoryInventoryItemRepository();
  const supplierRepository = new MemorySupplierRepository();
  const warehouseRepository = new MemoryWarehouseRepository();
  const purchaseOrderRepository = new MemoryPurchaseOrderRepository(
    inventoryItemRepository,
  );
  const replenishmentRepository = new MemoryReplenishmentRepository(
    inventoryItemRepository,
    purchaseOrderRepository,
  );
  const warehouseTransferRepository = new MemoryWarehouseTransferRepository(
    inventoryItemRepository,
  );
  const shipmentRepository = new MemoryShipmentRepository();
  const reportFoundationRepository = new MemoryReportFoundationRepository();
  const procurementReportRepository = new MemoryProcurementReportRepository(
    purchaseOrderRepository,
    supplierRepository,
    warehouseRepository,
    replenishmentRepository,
    warehouseTransferRepository,
    inventoryItemRepository,
    shipmentRepository,
  );

  reportFoundationRepository.seedStoreReportingContext({
    storeId: "11111111-1111-1111-1111-111111111111",
    defaultTimezone: "America/New_York",
    defaultCurrency: "USD",
    activeWarehouseIds: [
      "33333333-3333-3333-3333-333333333333",
      "44444444-4444-4444-4444-444444444444",
    ],
  });
  reportFoundationRepository.seedStoreReportingContext({
    storeId: "22222222-2222-2222-2222-222222222222",
    defaultTimezone: "Europe/London",
    defaultCurrency: "GBP",
    activeWarehouseIds: [],
  });

  const procurementReportsService = new ProcurementReportsService({
    procurementReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    inventoryItemRepository,
    supplierRepository,
    warehouseRepository,
    purchaseOrderRepository,
    replenishmentRepository,
    warehouseTransferRepository,
    shipmentRepository,
    reportFoundationRepository,
    procurementReportRepository,
    procurementReportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}

export { seedProcurementScenario } from "./procurement-scenario-utils";
