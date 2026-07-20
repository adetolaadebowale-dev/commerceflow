"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { FulfillmentProgress } from "@/features/reports/fulfillment-progress";
import { ReportLowStockTable } from "@/features/reports/low-stock-table";
import { MetricGrid } from "@/features/reports/metric-grid";
import { OrderStatusChart } from "@/features/reports/order-status-chart";
import { RecentSalesOrdersTable } from "@/features/reports/recent-sales-orders-table";
import { ReportFilters } from "@/features/reports/report-filters";
import { StockMovementsTable } from "@/features/reports/stock-movements-table";
import { useCustomerSummary } from "@/features/reports/use-customer-summary";
import { useExecutiveDashboard } from "@/features/reports/use-executive-dashboard";
import { useInventoryMovements } from "@/features/reports/use-inventory-movements";
import { useLowStockReport } from "@/features/reports/use-low-stock-report";
import { useReportFilters } from "@/features/reports/use-report-filters";
import { useSalesOrdersReport } from "@/features/reports/use-sales-orders-report";
import { useSalesSummary } from "@/features/reports/use-sales-summary";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import {
  storeNotConfiguredMessage,
  unableToLoadMessage,
  unableToLoadTitle,
} from "@/lib/ui-messages";
import { useAuth } from "@/providers/auth-provider";
import { AdminApiError } from "@/types/api";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }
  return fallback;
}

export function ReportsDashboard() {
  const { storeId } = useAuth();
  const filterState = useReportFilters(storeId);
  const filters = filterState.filters;

  const executive = useExecutiveDashboard(filters);
  const sales = useSalesSummary(filters);
  const customers = useCustomerSummary(filters);
  const lowStock = useLowStockReport(filters);
  const salesOrders = useSalesOrdersReport(filters);
  const movements = useInventoryMovements(filters);

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message={storeNotConfiguredMessage("reports")}
      />
    );
  }

  const summary = executive.data?.executiveSummary;
  const currency = summary?.currency ?? sales.data?.metrics.currency ?? "USD";
  const overviewLoading =
    executive.isLoading || customers.isLoading || sales.isLoading;

  const overviewMetrics = [
    {
      label: "Total Orders",
      value: summary ? formatNumber(summary.orders) : "—",
      hint: "From executive sales summary",
      isLoading: executive.isLoading,
    },
    {
      label: "Total Revenue",
      value: summary
        ? formatCurrency(summary.netRevenue, currency)
        : "—",
      hint: "Net revenue for the selected period",
      isLoading: executive.isLoading,
    },
    {
      label: "Average Order Value",
      value: summary
        ? formatCurrency(summary.averageOrderValue, currency)
        : "—",
      isLoading: executive.isLoading,
    },
    {
      label: "New Customers",
      value: customers.data
        ? formatNumber(customers.data.metrics.newCustomers)
        : "—",
      hint: "Customers created in the selected period",
      isLoading: customers.isLoading,
    },
  ];

  const inventoryMetrics = [
    {
      label: "Inventory Valuation",
      value: summary
        ? formatCurrency(summary.inventoryValue, currency)
        : "—",
      isLoading: executive.isLoading,
    },
    {
      label: "Low Stock Count",
      value: summary ? formatNumber(summary.lowStockCount) : "—",
      isLoading: executive.isLoading,
    },
    {
      label: "Out of Stock",
      value: lowStock.data
        ? formatNumber(lowStock.data.outOfStockItems.length)
        : "—",
      hint: "Items on the current report page",
      isLoading: lowStock.isLoading,
    },
    {
      label: "Stock Movements",
      value: movements.data
        ? formatNumber(movements.data.totals.movementCount)
        : "—",
      isLoading: movements.isLoading,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Sales, inventory, and order analytics from store reporting APIs.
            {executive.data
              ? ` Generated ${formatDateTime(executive.data.generatedAt)}.`
              : null}
          </p>
        </div>
        <ReportFilters
          preset={filterState.preset}
          customFrom={filterState.customFrom}
          customTo={filterState.customTo}
          hasCustomRange={filterState.hasCustomRange}
          onPresetChange={filterState.setPreset}
          onCustomRangeChange={filterState.setCustomRange}
          onClearCustomRange={filterState.clearCustomRange}
        />
      </div>

      <section className="space-y-3" aria-labelledby="sales-overview-heading">
        <h2 id="sales-overview-heading" className="text-lg font-semibold">
          Sales overview
        </h2>
        {executive.isError ? (
          <ErrorState
            title={unableToLoadTitle("sales overview")}
            message={errorMessage(
              executive.error,
              unableToLoadMessage("sales overview"),
            )}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => executive.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <MetricGrid metrics={overviewMetrics} />
        )}
        {customers.isError ? (
          <ErrorState
            title={unableToLoadTitle("customer metrics")}
            message={errorMessage(
              customers.error,
              unableToLoadMessage("customer metrics"),
            )}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => customers.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : null}
      </section>

      <section className="space-y-3" aria-labelledby="inventory-heading">
        <h2 id="inventory-heading" className="text-lg font-semibold">
          Inventory
        </h2>
        <MetricGrid metrics={inventoryMetrics} />
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Low stock</CardTitle>
              <CardDescription>
                Items at or below reorder point.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.isError ? (
                <ErrorState
                  title={unableToLoadTitle("low stock")}
                  message={errorMessage(
                    lowStock.error,
                    unableToLoadMessage("low stock"),
                  )}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lowStock.refetch()}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : (
                <ReportLowStockTable
                  title="low stock"
                  emptyTitle="No low stock items"
                  emptyDescription="Inventory levels are healthy relative to configured thresholds."
                  items={lowStock.data?.lowStockItems ?? []}
                  isLoading={lowStock.isLoading}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Out of stock
              </CardTitle>
              <CardDescription>
                Items with no available quantity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.isError ? (
                <ErrorState
                  title={unableToLoadTitle("out of stock")}
                  message={errorMessage(
                    lowStock.error,
                    unableToLoadMessage("out of stock"),
                  )}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lowStock.refetch()}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : (
                <ReportLowStockTable
                  title="out of stock"
                  emptyTitle="No out-of-stock items"
                  emptyDescription="No products are fully out of stock for this store."
                  items={lowStock.data?.outOfStockItems ?? []}
                  isLoading={lowStock.isLoading}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Recent stock movements
            </CardTitle>
            <CardDescription>
              Latest inventory movements for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {movements.isError ? (
              <ErrorState
                title={unableToLoadTitle("stock movements")}
                message={errorMessage(
                  movements.error,
                  unableToLoadMessage("stock movements"),
                )}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => movements.refetch()}
                  >
                    Retry
                  </Button>
                }
              />
            ) : (
              <StockMovementsTable
                movements={movements.data?.items ?? []}
                isLoading={movements.isLoading}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-lg font-semibold">
          Orders
        </h2>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Orders by status
              </CardTitle>
              <CardDescription>
                Status mix from the sales summary report.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sales.isError ? (
                <ErrorState
                  title={unableToLoadTitle("order status")}
                  message={errorMessage(
                    sales.error,
                    unableToLoadMessage("order status"),
                  )}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => sales.refetch()}
                    >
                      Retry
                    </Button>
                  }
                />
              ) : (
                <OrderStatusChart
                  rows={sales.data?.byOrderStatus ?? []}
                  currency={currency}
                  isLoading={sales.isLoading || overviewLoading}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Fulfillment progress
              </CardTitle>
              <CardDescription>
                Fulfilled share of orders plus executive fulfillment volume.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FulfillmentProgress
                byStatus={sales.data?.byOrderStatus ?? []}
                fulfillmentVolume={summary?.fulfillmentVolume ?? 0}
                isLoading={sales.isLoading || executive.isLoading}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Recent orders</CardTitle>
            <CardDescription>
              Latest sales orders for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesOrders.isError ? (
              <ErrorState
                title={unableToLoadTitle("recent orders")}
                message={errorMessage(
                  salesOrders.error,
                  unableToLoadMessage("recent orders"),
                )}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => salesOrders.refetch()}
                  >
                    Retry
                  </Button>
                }
              />
            ) : (
              <RecentSalesOrdersTable
                orders={salesOrders.data?.items ?? []}
                isLoading={salesOrders.isLoading}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
