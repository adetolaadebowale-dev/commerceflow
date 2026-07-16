import type { StoreReportingContext } from "@commerceflow/types";

import {
  DEFAULT_REPORT_CURRENCY,
  DEFAULT_REPORT_TIMEZONE,
} from "../services/report-utils";
import type { ReportFoundationRepository } from "./report-foundation.repository";

export class MemoryReportFoundationRepository implements ReportFoundationRepository {
  private readonly contexts = new Map<string, StoreReportingContext>();

  seedStoreReportingContext(context: StoreReportingContext): void {
    this.contexts.set(context.storeId, context);
  }

  async getStoreReportingContext(storeId: string): Promise<StoreReportingContext> {
    const existing = this.contexts.get(storeId);

    if (existing) {
      return existing;
    }

    return {
      storeId,
      defaultTimezone: DEFAULT_REPORT_TIMEZONE,
      defaultCurrency: DEFAULT_REPORT_CURRENCY,
      activeWarehouseIds: [],
    };
  }
}
