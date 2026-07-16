import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryInventoryAllocationRepository } from "@/inventory-allocation/repositories/memory-inventory-allocation.repository";
import { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import { MemoryStockMovementRepository } from "@/inventory/repositories/memory-stock-movement.repository";
import { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import { MemoryInventoryReservationRepository } from "@/reservations/repositories/memory-inventory-reservation.repository";
import { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import { MemoryReportFoundationRepository } from "../../repositories/memory-report-foundation.repository";
import { MemoryInventoryReportRepository } from "../repositories/memory-inventory-report.repository";
import { InventoryReportsService } from "../services/inventory-reports.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "../../testing/reports-test-utils";

export function createMemoryInventoryReportsModule(
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
  const stockMovementRepository = new MemoryStockMovementRepository(
    inventoryItemRepository,
  );
  const reservationRepository = new MemoryInventoryReservationRepository(
    inventoryItemRepository,
  );
  const allocationRepository = new MemoryInventoryAllocationRepository();
  const purchaseOrderRepository = new MemoryPurchaseOrderRepository(
    inventoryItemRepository,
  );
  const replenishmentRepository = new MemoryReplenishmentRepository(
    inventoryItemRepository,
    purchaseOrderRepository,
  );
  const reportFoundationRepository = new MemoryReportFoundationRepository();
  const inventoryReportRepository = new MemoryInventoryReportRepository(
    inventoryItemRepository,
    stockMovementRepository,
    reservationRepository,
    allocationRepository,
    purchaseOrderRepository,
    replenishmentRepository,
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

  const inventoryReportsService = new InventoryReportsService({
    inventoryReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    inventoryItemRepository,
    stockMovementRepository,
    reservationRepository,
    allocationRepository,
    purchaseOrderRepository,
    replenishmentRepository,
    reportFoundationRepository,
    inventoryReportRepository,
    inventoryReportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}

export { seedInventoryReportingScenario } from "./inventory-scenario-utils";
