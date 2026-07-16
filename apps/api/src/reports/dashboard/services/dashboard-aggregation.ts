import type {
  CustomerSummary,
  DashboardKPI,
  DashboardSection,
  DashboardSectionKey,
  ExecutiveSummary,
  FinancialSummary,
  InventorySummary,
  ProcurementSummary,
  SalesSummary,
} from "@commerceflow/types";

import { parseCurrencyAmount } from "../../services/report-utils";
import type { DashboardSourceSummaries } from "../repositories/dashboard-report.repository";

function formatRate(numerator: string, denominator: string): string {
  const denominatorCents = parseCurrencyAmount(denominator);
  if (denominatorCents === 0n) {
    return "0.00";
  }

  const numeratorCents = parseCurrencyAmount(numerator);
  const rate = (Number(numeratorCents) / Number(denominatorCents)) * 100;
  return rate.toFixed(2);
}

export function buildExecutiveSummary(
  summaries: DashboardSourceSummaries,
): ExecutiveSummary {
  const currency = summaries.financial.metrics.currency;

  return {
    grossRevenue: summaries.financial.metrics.grossRevenue,
    netRevenue: summaries.financial.metrics.netRevenue,
    orders: summaries.sales.metrics.orderCount,
    customers: summaries.customers.metrics.totalCustomers,
    averageOrderValue: summaries.sales.metrics.averageOrderValue,
    inventoryValue: summaries.inventory.metrics.inventoryValue,
    lowStockCount: summaries.inventory.lowStockItems.length,
    purchaseOrderValue: summaries.procurement.metrics.purchaseOrderValue,
    warehouseThroughput: summaries.procurement.warehousePerformance.totalThroughput,
    fulfillmentVolume: summaries.procurement.metrics.fulfillmentVolume,
    returnRate: formatRate(
      summaries.financial.metrics.refundTotals,
      summaries.financial.metrics.grossRevenue,
    ),
    collectionRate: summaries.financial.metrics.collectionRate,
    replenishmentAcceptanceRate:
      summaries.procurement.metrics.recommendationAcceptanceRate,
    currency,
  };
}

function kpi(
  key: string,
  label: string,
  value: string | number,
  section: DashboardSectionKey,
  options: { readonly unit?: string; readonly currency?: string } = {},
): DashboardKPI {
  return {
    key,
    label,
    value,
    section,
    unit: options.unit,
    currency: options.currency,
  };
}

export function buildExecutiveOverviewSection(
  executiveSummary: ExecutiveSummary,
): DashboardSection {
  const currency = executiveSummary.currency;

  return {
    key: "executive_overview",
    title: "Executive Overview",
    kpis: [
      kpi("gross_revenue", "Gross Revenue", executiveSummary.grossRevenue, "executive_overview", { currency }),
      kpi("net_revenue", "Net Revenue", executiveSummary.netRevenue, "executive_overview", { currency }),
      kpi("orders", "Orders", executiveSummary.orders, "executive_overview"),
      kpi("customers", "Customers", executiveSummary.customers, "executive_overview"),
      kpi("average_order_value", "Average Order Value", executiveSummary.averageOrderValue, "executive_overview", { currency }),
      kpi("inventory_value", "Inventory Value", executiveSummary.inventoryValue, "executive_overview", { currency }),
      kpi("low_stock_count", "Low Stock Count", executiveSummary.lowStockCount, "executive_overview"),
      kpi("purchase_order_value", "Purchase Order Value", executiveSummary.purchaseOrderValue, "executive_overview", { currency }),
      kpi("warehouse_throughput", "Warehouse Throughput", executiveSummary.warehouseThroughput, "executive_overview"),
      kpi("fulfillment_volume", "Fulfillment Volume", executiveSummary.fulfillmentVolume, "executive_overview"),
      kpi("return_rate", "Return Rate", executiveSummary.returnRate, "executive_overview", { unit: "percent" }),
      kpi("collection_rate", "Collection Rate", executiveSummary.collectionRate, "executive_overview", { unit: "percent" }),
      kpi("replenishment_acceptance_rate", "Replenishment Acceptance Rate", executiveSummary.replenishmentAcceptanceRate, "executive_overview", { unit: "percent" }),
    ],
  };
}

export function buildSalesSection(sales: SalesSummary): DashboardSection {
  const currency = sales.metrics.currency;

  return {
    key: "sales",
    title: "Sales KPIs",
    kpis: [
      kpi("gross_sales", "Gross Sales", sales.metrics.grossSales, "sales", { currency }),
      kpi("net_sales", "Net Sales", sales.metrics.netSales, "sales", { currency }),
      kpi("order_count", "Orders", sales.metrics.orderCount, "sales"),
      kpi("units_sold", "Units Sold", sales.metrics.unitsSold, "sales"),
      kpi("average_order_value", "Average Order Value", sales.metrics.averageOrderValue, "sales", { currency }),
      kpi("discounts", "Discounts", sales.metrics.discounts, "sales", { currency }),
      kpi("taxes", "Taxes", sales.metrics.taxes, "sales", { currency }),
      kpi("shipping", "Shipping", sales.metrics.shipping, "sales", { currency }),
    ],
  };
}

export function buildFinancialSection(financial: FinancialSummary): DashboardSection {
  const currency = financial.metrics.currency;

  return {
    key: "financial",
    title: "Financial KPIs",
    kpis: [
      kpi("gross_revenue", "Gross Revenue", financial.metrics.grossRevenue, "financial", { currency }),
      kpi("net_revenue", "Net Revenue", financial.metrics.netRevenue, "financial", { currency }),
      kpi("refund_totals", "Refund Totals", financial.metrics.refundTotals, "financial", { currency }),
      kpi("outstanding_invoices", "Outstanding Invoices", financial.metrics.outstandingInvoices, "financial", { currency }),
      kpi("collection_rate", "Collection Rate", financial.metrics.collectionRate, "financial", { unit: "percent" }),
      kpi("payment_totals", "Payment Totals", financial.metrics.paymentTotals, "financial", { currency }),
      kpi("invoice_totals", "Invoice Totals", financial.metrics.invoiceTotals, "financial", { currency }),
      kpi("average_payment_amount", "Average Payment Amount", financial.metrics.averagePaymentAmount, "financial", { currency }),
    ],
  };
}

export function buildInventorySection(inventory: InventorySummary): DashboardSection {
  const currency = inventory.metrics.currency;

  return {
    key: "inventory",
    title: "Inventory KPIs",
    kpis: [
      kpi("inventory_value", "Inventory Value", inventory.metrics.inventoryValue, "inventory", { currency }),
      kpi("quantity_on_hand", "Quantity On Hand", inventory.metrics.quantityOnHand, "inventory"),
      kpi("quantity_available", "Quantity Available", inventory.metrics.quantityAvailable, "inventory"),
      kpi("quantity_reserved", "Quantity Reserved", inventory.metrics.quantityReserved, "inventory"),
      kpi("quantity_incoming", "Quantity Incoming", inventory.metrics.quantityIncoming, "inventory"),
      kpi("low_stock_count", "Low Stock Count", inventory.lowStockItems.length, "inventory"),
      kpi("out_of_stock_count", "Out of Stock Count", inventory.outOfStockItems.length, "inventory"),
      kpi("stock_movement_total", "Stock Movement Total", inventory.metrics.stockMovementTotal, "inventory"),
    ],
  };
}

export function buildCustomerSection(customers: CustomerSummary): DashboardSection {
  const currency = customers.metrics.currency;

  return {
    key: "customers",
    title: "Customer KPIs",
    kpis: [
      kpi("total_customers", "Total Customers", customers.metrics.totalCustomers, "customers"),
      kpi("active_customers", "Active Customers", customers.metrics.activeCustomers, "customers"),
      kpi("new_customers", "New Customers", customers.metrics.newCustomers, "customers"),
      kpi("returning_customers", "Returning Customers", customers.metrics.returningCustomers, "customers"),
      kpi("lifetime_value", "Lifetime Value", customers.metrics.lifetimeValue, "customers", { currency }),
      kpi("average_order_value", "Average Order Value", customers.metrics.averageOrderValue, "customers", { currency }),
      kpi("orders_per_customer", "Orders Per Customer", customers.metrics.ordersPerCustomer, "customers"),
      kpi("revenue_per_customer", "Revenue Per Customer", customers.metrics.revenuePerCustomer, "customers", { currency }),
    ],
  };
}

export function buildProcurementSection(procurement: ProcurementSummary): DashboardSection {
  const currency = procurement.metrics.currency;

  return {
    key: "procurement",
    title: "Procurement KPIs",
    kpis: [
      kpi("purchase_order_count", "Purchase Order Count", procurement.metrics.purchaseOrderCount, "procurement"),
      kpi("purchase_order_value", "Purchase Order Value", procurement.metrics.purchaseOrderValue, "procurement", { currency }),
      kpi("receiving_rate", "Receiving Rate", procurement.metrics.receivingRate, "procurement", { unit: "percent" }),
      kpi("partial_receiving_rate", "Partial Receiving Rate", procurement.metrics.partialReceivingRate, "procurement", { unit: "percent" }),
      kpi("transfer_volume", "Transfer Volume", procurement.metrics.transferVolume, "procurement"),
      kpi("replenishment_recommendation_count", "Replenishment Recommendations", procurement.metrics.replenishmentRecommendationCount, "procurement"),
      kpi("replenishment_acceptance_rate", "Replenishment Acceptance Rate", procurement.metrics.recommendationAcceptanceRate, "procurement", { unit: "percent" }),
      kpi("active_suppliers", "Active Suppliers", procurement.supplierPerformance.supplierCount, "procurement"),
    ],
  };
}

export function buildWarehouseSection(procurement: ProcurementSummary): DashboardSection {
  return {
    key: "warehouse",
    title: "Warehouse KPIs",
    kpis: [
      kpi("warehouse_count", "Warehouse Count", procurement.warehousePerformance.warehouseCount, "warehouse"),
      kpi("total_throughput", "Total Throughput", procurement.warehousePerformance.totalThroughput, "warehouse"),
      kpi("average_inventory_turnover", "Average Inventory Turnover", procurement.warehousePerformance.averageInventoryTurnover, "warehouse", { unit: "percent" }),
      kpi("total_transfer_volume", "Total Transfer Volume", procurement.warehousePerformance.totalTransferVolume, "warehouse"),
      kpi("in_transit_transfers", "In Transit Transfers", procurement.transferAnalytics.inTransitCount, "warehouse"),
      kpi("received_transfers", "Received Transfers", procurement.transferAnalytics.receivedCount, "warehouse"),
    ],
  };
}

export function buildFulfillmentSection(procurement: ProcurementSummary): DashboardSection {
  return {
    key: "fulfillment",
    title: "Fulfillment KPIs",
    kpis: [
      kpi("fulfillment_volume", "Fulfillment Volume", procurement.fulfillmentAnalytics.fulfillmentVolume, "fulfillment"),
      kpi("shipment_count", "Shipment Count", procurement.fulfillmentAnalytics.shipmentCount, "fulfillment"),
      kpi("shipped_count", "Shipped Count", procurement.fulfillmentAnalytics.shippedCount, "fulfillment"),
      kpi("delivered_count", "Delivered Count", procurement.fulfillmentAnalytics.deliveredCount, "fulfillment"),
      kpi("pending_shipments", "Pending Shipments", procurement.fulfillmentAnalytics.pendingCount, "fulfillment"),
    ],
  };
}

export function buildDashboardSections(
  summaries: DashboardSourceSummaries,
  executiveSummary: ExecutiveSummary,
): readonly DashboardSection[] {
  return [
    buildExecutiveOverviewSection(executiveSummary),
    buildSalesSection(summaries.sales),
    buildFinancialSection(summaries.financial),
    buildInventorySection(summaries.inventory),
    buildCustomerSection(summaries.customers),
    buildProcurementSection(summaries.procurement),
    buildWarehouseSection(summaries.procurement),
    buildFulfillmentSection(summaries.procurement),
  ];
}

export function flattenDashboardKPIs(
  sections: readonly DashboardSection[],
): readonly DashboardKPI[] {
  return sections.flatMap((section) => section.kpis);
}
