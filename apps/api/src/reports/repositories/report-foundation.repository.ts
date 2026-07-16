import type { StoreReportingContext } from "@commerceflow/types";

export interface ReportFoundationRepository {
  getStoreReportingContext(storeId: string): Promise<StoreReportingContext>;
}
