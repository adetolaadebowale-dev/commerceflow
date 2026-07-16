import type { CustomerReportsService } from "../../customers/services/customer-reports.service";
import type { FinancialReportsService } from "../../financial/services/financial-reports.service";
import type { InventoryReportsService } from "../../inventory/services/inventory-reports.service";
import type { ProcurementReportsService } from "../../procurement/services/procurement-reports.service";
import type { SalesReportsService } from "../../sales/services/sales-reports.service";
import type {
  DashboardReportRepository,
  DashboardSourceSummaries,
} from "./dashboard-report.repository";

export class MemoryDashboardReportRepository implements DashboardReportRepository {
  constructor(
    private readonly salesReportsService: SalesReportsService,
    private readonly financialReportsService: FinancialReportsService,
    private readonly inventoryReportsService: InventoryReportsService,
    private readonly customerReportsService: CustomerReportsService,
    private readonly procurementReportsService: ProcurementReportsService,
  ) {}

  async loadSourceSummaries(
    query: Parameters<DashboardReportRepository["loadSourceSummaries"]>[0],
  ): Promise<DashboardSourceSummaries> {
    const [sales, financial, inventory, customers, procurement] =
      await Promise.all([
        this.salesReportsService.getSummary(query),
        this.financialReportsService.getSummary(query),
        this.inventoryReportsService.getSummary(query),
        this.customerReportsService.getSummary(query),
        this.procurementReportsService.getSummary(query),
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
