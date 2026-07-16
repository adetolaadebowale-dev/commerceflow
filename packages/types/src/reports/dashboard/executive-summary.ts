/** Top-level executive KPIs consolidated from domain reporting modules. */
export interface ExecutiveSummary {
  readonly grossRevenue: string;
  readonly netRevenue: string;
  readonly orders: number;
  readonly customers: number;
  readonly averageOrderValue: string;
  readonly inventoryValue: string;
  readonly lowStockCount: number;
  readonly purchaseOrderValue: string;
  readonly warehouseThroughput: number;
  readonly fulfillmentVolume: number;
  readonly returnRate: string;
  readonly collectionRate: string;
  readonly replenishmentAcceptanceRate: string;
  readonly currency: string;
}
