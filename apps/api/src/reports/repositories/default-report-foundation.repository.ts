import type { StoreReportingContext } from "@commerceflow/types";

import { getWarehouseRepository } from "@/warehouses/repositories";
import {
  DEFAULT_REPORT_CURRENCY,
  DEFAULT_REPORT_TIMEZONE,
} from "../services/report-utils";
import type { ReportFoundationRepository } from "./report-foundation.repository";

export class DefaultReportFoundationRepository implements ReportFoundationRepository {
  constructor(
    private readonly warehouseRepository = getWarehouseRepository(),
  ) {}

  async getStoreReportingContext(storeId: string): Promise<StoreReportingContext> {
    const warehouses = await this.warehouseRepository.list({
      storeId,
      page: 1,
      limit: 100,
    });

    return {
      storeId,
      defaultTimezone: DEFAULT_REPORT_TIMEZONE,
      defaultCurrency: DEFAULT_REPORT_CURRENCY,
      activeWarehouseIds: warehouses.items
        .filter((warehouse) => warehouse.status === "active")
        .map((warehouse) => warehouse.id),
    };
  }
}
