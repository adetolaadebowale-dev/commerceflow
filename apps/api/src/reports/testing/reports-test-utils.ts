import type { DomainEventPublisher } from "@/domain-events";
import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryReportFoundationRepository } from "../repositories/memory-report-foundation.repository";
import { ReportsService } from "../services/reports.service";

export const TEST_STORE_A_ID = "11111111-1111-1111-1111-111111111111";
export const TEST_STORE_B_ID = "22222222-2222-2222-2222-222222222222";
export const TEST_WAREHOUSE_A_ID = "33333333-3333-3333-3333-333333333333";
export const TEST_WAREHOUSE_B_ID = "44444444-4444-4444-4444-444444444444";

export function createMemoryReportsModule(
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

  const reportFoundationRepository = new MemoryReportFoundationRepository();
  reportFoundationRepository.seedStoreReportingContext({
    storeId: TEST_STORE_A_ID,
    defaultTimezone: "America/New_York",
    defaultCurrency: "USD",
    activeWarehouseIds: [TEST_WAREHOUSE_A_ID, TEST_WAREHOUSE_B_ID],
  });
  reportFoundationRepository.seedStoreReportingContext({
    storeId: TEST_STORE_B_ID,
    defaultTimezone: "Europe/London",
    defaultCurrency: "GBP",
    activeWarehouseIds: [],
  });

  const reportsService = new ReportsService({
    reportFoundationRepository,
    domainEventPublisher: publisher,
  });

  return {
    reportFoundationRepository,
    reportsService,
    dispatcher: "dispatcher" in eventing ? eventing.dispatcher : undefined,
    domainEventPublisher: publisher,
  };
}
