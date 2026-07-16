/** Identifiers for executive dashboard sections. */
export type DashboardSectionKey =
  | "executive_overview"
  | "sales"
  | "financial"
  | "inventory"
  | "customers"
  | "procurement"
  | "warehouse"
  | "fulfillment";

/** Single KPI tile within a dashboard section. */
export interface DashboardKPI {
  readonly key: string;
  readonly label: string;
  readonly value: string | number;
  readonly unit?: string;
  readonly currency?: string;
  readonly section: DashboardSectionKey;
}
