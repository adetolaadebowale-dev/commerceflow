"use client";

import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { KpiCards } from "@/features/dashboard/kpi-cards";
import { LowStockTable } from "@/features/dashboard/low-stock-table";
import { QuickActions } from "@/features/dashboard/quick-actions";
import { RecentActivityTable } from "@/features/dashboard/recent-activity-table";
import { RecentOrdersTable } from "@/features/dashboard/recent-orders-table";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchDashboardKpis,
  fetchDashboardLowStock,
  fetchDashboardRecentActivity,
  fetchDashboardRecentOrders,
} from "@/services/dashboard.service";
import { AdminApiError } from "@/types/api";

function widgetErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function DashboardHome() {
  const { storeId } = useAuth();

  const kpisQuery = useQuery({
    queryKey: ["dashboard-kpis", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return fetchDashboardKpis(storeId);
    },
  });

  const ordersQuery = useQuery({
    queryKey: ["dashboard-recent-orders", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return fetchDashboardRecentOrders(storeId);
    },
  });

  const lowStockQuery = useQuery({
    queryKey: ["dashboard-low-stock", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return fetchDashboardLowStock(storeId);
    },
  });

  const activityQuery = useQuery({
    queryKey: ["dashboard-recent-activity", storeId],
    enabled: Boolean(storeId),
    queryFn: () => {
      if (!storeId) {
        throw new Error("Store id is required");
      }
      return fetchDashboardRecentActivity(storeId);
    },
  });

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message="Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to load dashboard data."
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to CommerceFlow
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Overview of your store performance and recent activity.
        </p>
      </div>

      {kpisQuery.isLoading ? (
        <div className="flex min-h-[7rem] items-center justify-center">
          <LoadingSpinner label="Loading KPIs..." />
        </div>
      ) : kpisQuery.isError ? (
        <ErrorState
          title="Unable to load KPIs"
          message={widgetErrorMessage(
            kpisQuery.error,
            "Unable to load dashboard KPIs.",
          )}
        />
      ) : (
        <KpiCards kpis={kpisQuery.data ?? []} />
      )}

      <QuickActions />

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentOrdersTable
          orders={ordersQuery.data ?? []}
          isLoading={ordersQuery.isLoading}
          error={
            ordersQuery.isError
              ? widgetErrorMessage(
                  ordersQuery.error,
                  "Unable to load recent orders.",
                )
              : null
          }
        />
        <LowStockTable
          items={lowStockQuery.data ?? []}
          isLoading={lowStockQuery.isLoading}
          error={
            lowStockQuery.isError
              ? widgetErrorMessage(
                  lowStockQuery.error,
                  "Unable to load low stock items.",
                )
              : null
          }
        />
      </div>

      <RecentActivityTable
        activity={activityQuery.data ?? []}
        isLoading={activityQuery.isLoading}
        error={
          activityQuery.isError
            ? widgetErrorMessage(
                activityQuery.error,
                "Unable to load recent activity.",
              )
            : null
        }
      />
    </div>
  );
}
