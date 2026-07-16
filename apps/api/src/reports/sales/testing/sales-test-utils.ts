import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { MemoryReportFoundationRepository } from "../../repositories/memory-report-foundation.repository";
import { MemorySalesReportRepository } from "../repositories/memory-sales-report.repository";
import { SalesReportsService } from "../services/sales-reports.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
  TEST_WAREHOUSE_A_ID,
  TEST_WAREHOUSE_B_ID,
} from "../../testing/reports-test-utils";

export function createMemorySalesReportsModule(
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
  const shipmentRepository = new MemoryShipmentRepository();
  const reportFoundationRepository = new MemoryReportFoundationRepository();
  const salesReportRepository = new MemorySalesReportRepository(
    orderRepository,
    paymentRepository,
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

  const salesReportsService = new SalesReportsService({
    salesReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    orderRepository,
    paymentRepository,
    shipmentRepository,
    reportFoundationRepository,
    salesReportRepository,
    salesReportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}

export { seedSalesScenario } from "./sales-scenario-utils";
