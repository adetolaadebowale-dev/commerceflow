import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import { MemoryInventoryItemRepository } from "@/inventory/repositories/memory-inventory-item.repository";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryPurchaseOrderRepository } from "@/purchase-orders/repositories/memory-purchase-order.repository";
import { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import { MemoryReplenishmentRepository } from "@/replenishment/repositories/memory-replenishment.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { MemorySupplierRepository } from "@/suppliers/repositories/memory-supplier.repository";
import { MemoryWarehouseRepository } from "@/warehouses/repositories/memory-warehouse.repository";
import { MemoryWarehouseTransferRepository } from "@/warehouse-transfers/repositories/memory-warehouse-transfer.repository";
import { CustomerReportsService } from "../../customers/services/customer-reports.service";
import { MemoryCustomerReportRepository } from "../../customers/repositories/memory-customer-report.repository";
import { FinancialReportsService } from "../../financial/services/financial-reports.service";
import { MemoryFinancialReportRepository } from "../../financial/repositories/memory-financial-report.repository";
import { InventoryReportsService } from "../../inventory/services/inventory-reports.service";
import { MemoryInventoryReportRepository } from "../../inventory/repositories/memory-inventory-report.repository";
import { MemoryInventoryReservationRepository } from "@/reservations/repositories/memory-inventory-reservation.repository";
import { MemoryStockMovementRepository } from "@/inventory/repositories/memory-stock-movement.repository";
import { MemoryInventoryAllocationRepository } from "@/inventory-allocation/repositories/memory-inventory-allocation.repository";
import { ProcurementReportsService } from "../../procurement/services/procurement-reports.service";
import { MemoryProcurementReportRepository } from "../../procurement/repositories/memory-procurement-report.repository";
import { MemoryReportFoundationRepository } from "../../repositories/memory-report-foundation.repository";
import { SalesReportsService } from "../../sales/services/sales-reports.service";
import { MemorySalesReportRepository } from "../../sales/repositories/memory-sales-report.repository";
import { MemoryDashboardReportRepository } from "../repositories/memory-dashboard-report.repository";
import { DashboardReportsService } from "../services/dashboard-reports.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "../../testing/reports-test-utils";

export function createMemoryDashboardReportsModule(
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

  const orderRepository = new MemoryOrderRepository();
  const paymentRepository = new MemoryPaymentRepository();
  const refundRepository = new MemoryRefundRepository();
  const invoiceRepository = new MemoryInvoiceRepository();
  const shipmentRepository = new MemoryShipmentRepository();
  const customerRepository = new MemoryCustomerRepository();
  const customerAddressRepository = new MemoryCustomerAddressRepository();
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
  const supplierRepository = new MemorySupplierRepository();
  const warehouseRepository = new MemoryWarehouseRepository();
  const replenishmentRepository = new MemoryReplenishmentRepository(
    inventoryItemRepository,
    purchaseOrderRepository,
  );
  const warehouseTransferRepository = new MemoryWarehouseTransferRepository(
    inventoryItemRepository,
  );
  const reportFoundationRepository = new MemoryReportFoundationRepository();

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

  const salesReportsService = new SalesReportsService({
    salesReportRepository: new MemorySalesReportRepository(
      orderRepository,
      paymentRepository,
      shipmentRepository,
    ),
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });
  const financialReportsService = new FinancialReportsService({
    financialReportRepository: new MemoryFinancialReportRepository(
      orderRepository,
      paymentRepository,
      invoiceRepository,
      refundRepository,
      shipmentRepository,
    ),
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });
  const inventoryReportsService = new InventoryReportsService({
    inventoryReportRepository: new MemoryInventoryReportRepository(
      inventoryItemRepository,
      stockMovementRepository,
      reservationRepository,
      allocationRepository,
      purchaseOrderRepository,
      replenishmentRepository,
    ),
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });
  const customerReportsService = new CustomerReportsService({
    customerReportRepository: new MemoryCustomerReportRepository(
      customerRepository,
      customerAddressRepository,
      orderRepository,
      paymentRepository,
      refundRepository,
    ),
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });
  const procurementReportRepository = new MemoryProcurementReportRepository(
    purchaseOrderRepository,
    supplierRepository,
    warehouseRepository,
    replenishmentRepository,
    warehouseTransferRepository,
    inventoryItemRepository,
    shipmentRepository,
  );
  const procurementReportsService = new ProcurementReportsService({
    procurementReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  const dashboardReportRepository = new MemoryDashboardReportRepository(
    salesReportsService,
    financialReportsService,
    inventoryReportsService,
    customerReportsService,
    procurementReportsService,
  );

  const dashboardReportsService = new DashboardReportsService({
    dashboardReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    orderRepository,
    paymentRepository,
    refundRepository,
    invoiceRepository,
    shipmentRepository,
    customerRepository,
    customerAddressRepository,
    inventoryItemRepository,
    reservationRepository,
    replenishmentRepository,
    purchaseOrderRepository,
    procurementReportRepository,
    salesReportsService,
    financialReportsService,
    inventoryReportsService,
    customerReportsService,
    procurementReportsService,
    reportFoundationRepository,
    dashboardReportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}

export { seedDashboardScenario } from "./dashboard-scenario-utils";
