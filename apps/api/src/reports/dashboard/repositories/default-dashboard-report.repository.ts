import type { ExecutiveDashboardQuery } from "@commerceflow/validation";

import { customerReportsService } from "../../customers/services";
import { financialReportsService } from "../../financial/services";
import { inventoryReportsService } from "../../inventory/services";
import { procurementReportsService } from "../../procurement/services";
import { salesReportsService } from "../../sales/services";
import type {
  DashboardReportRepository,
  DashboardSourceSummaries,
} from "./dashboard-report.repository";

export class DefaultDashboardReportRepository implements DashboardReportRepository {
  async loadSourceSummaries(
    query: ExecutiveDashboardQuery,
  ): Promise<DashboardSourceSummaries> {
    const [sales, financial, inventory, customers, procurement] =
      await Promise.all([
        salesReportsService.getSummary(query),
        financialReportsService.getSummary(query),
        inventoryReportsService.getSummary(query),
        customerReportsService.getSummary(query),
        procurementReportsService.getSummary(query),
      ]);

    return {
      sales,
      financial,
      inventory,
      customers,
      procurement,
    };
  }
}

const dashboardReportRepository = new DefaultDashboardReportRepository();

export function getDashboardReportRepository(): DashboardReportRepository {
  return dashboardReportRepository;
}
