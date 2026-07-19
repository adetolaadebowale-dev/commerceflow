import {
  handleGetCustomerGrowth,
  handleGetCustomerSummary,
  handleGetTopCustomers,
  handleListCustomerOrders,
} from "@/reports/customers/routes/customers.route";
import {
  handleGetDashboardKPIs,
  handleGetExecutiveDashboard,
} from "@/reports/dashboard/routes/dashboard.route";
import {
  handleGetFinancialSummary,
  handleGetInvoiceReport,
  handleGetPaymentReport,
  handleGetRefundReport,
  handleGetRevenueTimeline,
} from "@/reports/financial/routes/financial.route";
import {
  handleGetInventoryMovements,
  handleGetInventorySummary,
  handleGetInventoryValuation,
  handleGetLowStockReport,
} from "@/reports/inventory/routes/inventory.route";
import {
  handleGetProcurementSummary,
  handleGetPurchaseOrderAnalytics,
  handleGetReplenishmentAnalytics,
  handleGetSupplierAnalytics,
  handleGetWarehouseAnalytics,
} from "@/reports/procurement/routes/procurement.route";
import { jsonError } from "@/reports/routes/http-response";
import {
  handleGetSalesSummary,
  handleGetSalesTimeline,
  handleListSalesOrders,
} from "@/reports/sales/routes/sales.route";

type ReportsHandler = (request: Request) => Promise<Response>;

/**
 * Nested report routes live behind a catch-all because Next.js 16 Turbopack
 * does not register App Router handlers more than two segments under `/api`.
 * Handlers themselves stay in the existing reports modules (no duplicated logic).
 */
const REPORT_ROUTES: Readonly<Record<string, ReportsHandler>> = {
  "dashboard/executive": handleGetExecutiveDashboard,
  "dashboard/kpis": handleGetDashboardKPIs,
  "inventory/summary": handleGetInventorySummary,
  "inventory/stock-movements": handleGetInventoryMovements,
  "inventory/low-stock": handleGetLowStockReport,
  "inventory/valuation": handleGetInventoryValuation,
  "sales/summary": handleGetSalesSummary,
  "sales/timeline": handleGetSalesTimeline,
  "sales/orders": handleListSalesOrders,
  "customers/summary": handleGetCustomerSummary,
  "customers/growth": handleGetCustomerGrowth,
  "customers/top": handleGetTopCustomers,
  "customers/orders": handleListCustomerOrders,
  "financial/summary": handleGetFinancialSummary,
  "financial/revenue": handleGetRevenueTimeline,
  "financial/payments": handleGetPaymentReport,
  "financial/invoices": handleGetInvoiceReport,
  "financial/refunds": handleGetRefundReport,
  "procurement/summary": handleGetProcurementSummary,
  "procurement/purchase-orders": handleGetPurchaseOrderAnalytics,
  "procurement/suppliers": handleGetSupplierAnalytics,
  "procurement/warehouses": handleGetWarehouseAnalytics,
  "procurement/replenishment": handleGetReplenishmentAnalytics,
};

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  const key = path.join("/");
  const handler = REPORT_ROUTES[key];

  if (!handler) {
    return jsonError(
      {
        code: "NOT_FOUND",
        message: `Report route not found: /api/reports/${key}`,
      },
      404,
    );
  }

  return handler(request);
}
