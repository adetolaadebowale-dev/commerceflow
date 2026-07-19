export interface DashboardKpi {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
}

export interface DashboardOrderRow {
  readonly id: string;
  readonly orderNumber: string;
  readonly customer: string;
  readonly status: string;
  readonly total: string;
  readonly date: string;
}

export interface DashboardLowStockRow {
  readonly id: string;
  readonly product: string;
  readonly sku: string;
  readonly remainingQuantity: number;
}

export interface DashboardActivityRow {
  readonly id: string;
  readonly action: string;
  readonly user: string;
  readonly time: string;
}

export interface DashboardOverview {
  readonly kpis: readonly DashboardKpi[];
  readonly recentOrders: readonly DashboardOrderRow[];
  readonly lowStock: readonly DashboardLowStockRow[];
  readonly recentActivity: readonly DashboardActivityRow[];
}
