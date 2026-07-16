/** Inclusive reporting window with timezone context for boundary resolution. */
export interface ReportDateRange {
  readonly from: string;
  readonly to: string;
  readonly timezone: string;
}

/** Common filter dimensions applied across report queries. */
export interface ReportFilter {
  readonly storeId: string;
  readonly warehouseIds?: readonly string[];
  readonly dateRange?: ReportDateRange;
  readonly currency?: string;
}

/** Pagination metadata returned with report result sets. */
export interface ReportPagination {
  readonly page: number;
  readonly limit: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

/** Metadata describing a generated report snapshot. */
export interface ReportSummary {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly filter: ReportFilter;
  readonly rowCount: number;
}

/** Single metric tile for dashboard read models. */
export interface DashboardMetric {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly currency?: string;
}

/** Foundation health response for the reporting subsystem. */
export interface ReportHealthResponse {
  readonly status: "ok";
  readonly version: string;
  readonly supportedFeatures: readonly string[];
}

/** Placeholder dashboard contract for Sprint 9.0 foundation. */
export interface ReportDashboardResponse {
  readonly storeId: string;
  readonly generatedAt: string;
  readonly timezone: string;
  readonly currency: string;
  readonly metrics: readonly DashboardMetric[];
  readonly summary: ReportSummary;
}

/** Store-scoped reporting defaults loaded by the foundation repository. */
export interface StoreReportingContext {
  readonly storeId: string;
  readonly defaultTimezone: string;
  readonly defaultCurrency: string;
  readonly activeWarehouseIds: readonly string[];
}
