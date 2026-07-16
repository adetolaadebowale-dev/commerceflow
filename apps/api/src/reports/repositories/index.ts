import { DefaultReportFoundationRepository } from "./default-report-foundation.repository";
import { MemoryReportFoundationRepository } from "./memory-report-foundation.repository";
import type { ReportFoundationRepository } from "./report-foundation.repository";

let reportFoundationRepository: ReportFoundationRepository | undefined;

export function getReportFoundationRepository(): ReportFoundationRepository {
  if (!reportFoundationRepository) {
    reportFoundationRepository = new DefaultReportFoundationRepository();
  }

  return reportFoundationRepository;
}

export function setReportFoundationRepository(
  repository: ReportFoundationRepository,
): void {
  reportFoundationRepository = repository;
}

export {
  DefaultReportFoundationRepository,
  MemoryReportFoundationRepository,
  type ReportFoundationRepository,
};
