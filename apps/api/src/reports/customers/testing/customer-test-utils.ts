import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryCustomerAddressRepository } from "@/customers/repositories/memory-customer-address.repository";
import { MemoryCustomerRepository } from "@/customers/repositories/memory-customer.repository";
import { MemoryOrderRepository } from "@/orders/repositories/memory-order.repository";
import { MemoryPaymentRepository } from "@/payments/repositories/memory-payment.repository";
import { MemoryRefundRepository } from "@/refunds/repositories/memory-refund.repository";
import { MemoryReportFoundationRepository } from "../../repositories/memory-report-foundation.repository";
import { MemoryCustomerReportRepository } from "../repositories/memory-customer-report.repository";
import { CustomerReportsService } from "../services/customer-reports.service";

export {
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../testing/reports-test-utils";

export function createMemoryCustomerReportsModule(
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

  const customerRepository = new MemoryCustomerRepository();
  const customerAddressRepository = new MemoryCustomerAddressRepository();
  const orderRepository = new MemoryOrderRepository();
  const paymentRepository = new MemoryPaymentRepository();
  const refundRepository = new MemoryRefundRepository();
  const reportFoundationRepository = new MemoryReportFoundationRepository();
  const customerReportRepository = new MemoryCustomerReportRepository(
    customerRepository,
    customerAddressRepository,
    orderRepository,
    paymentRepository,
    refundRepository,
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

  const customerReportsService = new CustomerReportsService({
    customerReportRepository,
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    customerRepository,
    customerAddressRepository,
    orderRepository,
    paymentRepository,
    refundRepository,
    reportFoundationRepository,
    customerReportRepository,
    customerReportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}

export { seedCustomerScenario } from "./customer-scenario-utils";
