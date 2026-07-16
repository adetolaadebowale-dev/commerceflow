import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryInvoiceRepository } from "@/invoices/repositories/memory-invoice.repository";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import { MemoryShipmentRepository } from "@/shipments/repositories/memory-shipment.repository";
import { MemoryReportFoundationRepository } from "../../repositories/memory-report-foundation.repository";
import { MemoryFinancialReportRepository } from "../repositories/memory-financial-report.repository";
import { FinancialReportsService } from "../services/financial-reports.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../testing/reports-test-utils";

export function createMemoryFinancialReportsModule(
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
  const invoiceRepository = new MemoryInvoiceRepository();
  const refundRepository = new MemoryRefundRepository();
  const shipmentRepository = new MemoryShipmentRepository();
  const reportFoundationRepository = new MemoryReportFoundationRepository();
  const financialReportRepository = new MemoryFinancialReportRepository(
    orderRepository,
    paymentRepository,
    invoiceRepository,
    refundRepository,
    shipmentRepository,
  );

  reportFoundationRepository.seedStoreReportingContext({
    storeId: "11111111-1111-1111-1111-111111111111",
    defaultTimezone: "America/New_York",
    defaultCurrency: "USD",
    activeWarehouseIds: [],
  });
  reportFoundationRepository.seedStoreReportingContext({
    storeId: "22222222-2222-2222-2222-222222222222",
    defaultTimezone: "Europe/London",
    defaultCurrency: "GBP",
    activeWarehouseIds: [],
  });

  const financialReportsService = new FinancialReportsService({
    financialReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    orderRepository,
    paymentRepository,
    invoiceRepository,
    refundRepository,
    shipmentRepository,
    reportFoundationRepository,
    financialReportRepository,
    financialReportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}

export { seedFinancialScenario } from "./financial-scenario-utils";
