import { apiRequest } from "@/services/api-client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { AdminApiError } from "@/types/api";
import type {
  DashboardActivityRow,
  DashboardKpi,
  DashboardLowStockRow,
  DashboardOrderRow,
  DashboardOverview,
} from "@/types/dashboard";

interface ListResult<T> {
  readonly items: readonly T[];
  readonly total: number;
}

interface ProductVariant {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
}

interface Product {
  readonly id: string;
  readonly name: string;
  readonly variants: readonly ProductVariant[];
}

interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId?: string;
  readonly status: string;
  readonly total: string;
  readonly currency: string;
  readonly createdAt: string;
}

interface Customer {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

interface InventorySummary {
  readonly metrics: {
    readonly inventoryValue: string;
    readonly currency: string;
  };
}

interface LowStockItem {
  readonly inventoryItemId: string;
  readonly productVariantId: string;
  readonly quantityAvailable: number;
  readonly quantityOnHand: number;
}

interface LowStockReport {
  readonly lowStockItems: readonly LowStockItem[];
  readonly outOfStockItems: readonly LowStockItem[];
}

interface AuditLog {
  readonly id: string;
  readonly userId: string;
  readonly action: string;
  readonly createdAt: string;
}

function customerLabel(customer: Customer | undefined, customerId?: string): string {
  if (customer) {
    const name = `${customer.firstName} ${customer.lastName}`.trim();
    return name || customer.email;
  }

  if (!customerId) {
    return "Guest";
  }

  return `Customer ${customerId.slice(0, 8)}`;
}

function buildVariantLookup(products: readonly Product[]): Map<
  string,
  { product: string; sku: string }
> {
  const lookup = new Map<string, { product: string; sku: string }>();

  for (const product of products) {
    for (const variant of product.variants) {
      lookup.set(variant.id, {
        product: product.name,
        sku: variant.sku,
      });
    }
  }

  return lookup;
}

function mapLowStockRows(
  report: LowStockReport,
  variants: Map<string, { product: string; sku: string }>,
): DashboardLowStockRow[] {
  const combined = [...report.lowStockItems, ...report.outOfStockItems].slice(
    0,
    10,
  );

  return combined.map((item) => {
    const variant = variants.get(item.productVariantId);
    return {
      id: item.inventoryItemId,
      product: variant?.product ?? "Unknown product",
      sku: variant?.sku ?? item.productVariantId.slice(0, 8),
      remainingQuantity: item.quantityAvailable,
    };
  });
}

function mapOrders(
  orders: readonly Order[],
  customersById: Map<string, Customer>,
): DashboardOrderRow[] {
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customer: customerLabel(
      order.customerId ? customersById.get(order.customerId) : undefined,
      order.customerId,
    ),
    status: order.status,
    total: formatCurrency(order.total, order.currency),
    date: formatDateTime(order.createdAt),
  }));
}

function mapActivity(logs: readonly AuditLog[]): DashboardActivityRow[] {
  return logs.map((log) => ({
    id: log.id,
    action: log.action.replaceAll("_", " "),
    user: `User ${log.userId.slice(0, 8)}`,
    time: formatDateTime(log.createdAt),
  }));
}

function errorMessage(error: unknown): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load data.";
}

async function settledValue<T>(promise: Promise<T>): Promise<
  { ok: true; value: T } | { ok: false; error: string }
> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function fetchDashboardKpis(
  storeId: string,
): Promise<readonly DashboardKpi[]> {
  const [productsCount, orders, customers, inventorySummary] = await Promise.all(
    [
      settledValue(
        apiRequest<ListResult<Product>>({
          method: "GET",
          url: "/api/products",
          params: { storeId, page: 1, limit: 1 },
        }),
      ),
      settledValue(
        apiRequest<ListResult<Order>>({
          method: "GET",
          url: "/api/orders",
          params: { storeId, page: 1, limit: 1 },
        }),
      ),
      settledValue(
        apiRequest<ListResult<Customer>>({
          method: "GET",
          url: "/api/customers",
          params: { storeId, page: 1, limit: 1 },
        }),
      ),
      settledValue(
        apiRequest<InventorySummary>({
          method: "GET",
          url: "/api/reports/inventory/summary",
          params: { storeId },
        }),
      ),
    ],
  );

  return [
    {
      key: "products",
      label: "Total Products",
      value: productsCount.ok ? String(productsCount.value.total) : "—",
      error: productsCount.ok ? undefined : productsCount.error,
    },
    {
      key: "orders",
      label: "Total Orders",
      value: orders.ok ? String(orders.value.total) : "—",
      error: orders.ok ? undefined : orders.error,
    },
    {
      key: "customers",
      label: "Total Customers",
      value: customers.ok ? String(customers.value.total) : "—",
      error: customers.ok ? undefined : customers.error,
    },
    {
      key: "inventory",
      label: "Inventory Value",
      value: inventorySummary.ok
        ? formatCurrency(
            inventorySummary.value.metrics.inventoryValue,
            inventorySummary.value.metrics.currency,
          )
        : "—",
      error: inventorySummary.ok ? undefined : inventorySummary.error,
    },
  ];
}

export async function fetchDashboardRecentOrders(
  storeId: string,
): Promise<readonly DashboardOrderRow[]> {
  const [orders, customers] = await Promise.all([
    apiRequest<ListResult<Order>>({
      method: "GET",
      url: "/api/orders",
      params: { storeId, page: 1, limit: 10 },
    }),
    apiRequest<ListResult<Customer>>({
      method: "GET",
      url: "/api/customers",
      params: { storeId, page: 1, limit: 100 },
    }),
  ]);

  const customersById = new Map(
    customers.items.map((customer) => [customer.id, customer]),
  );

  return mapOrders(orders.items, customersById);
}

export async function fetchDashboardLowStock(
  storeId: string,
): Promise<readonly DashboardLowStockRow[]> {
  const [lowStock, products] = await Promise.all([
    apiRequest<LowStockReport>({
      method: "GET",
      url: "/api/reports/inventory/low-stock",
      params: { storeId, page: 1, limit: 10 },
    }),
    apiRequest<ListResult<Product>>({
      method: "GET",
      url: "/api/products",
      params: { storeId, page: 1, limit: 100 },
    }),
  ]);

  return mapLowStockRows(lowStock, buildVariantLookup(products.items));
}

export async function fetchDashboardRecentActivity(
  storeId: string,
): Promise<readonly DashboardActivityRow[]> {
  const activity = await apiRequest<ListResult<AuditLog>>({
    method: "GET",
    url: "/api/audit-logs",
    params: { storeId, page: 1, limit: 10 },
  });

  return mapActivity(activity.items);
}

/** @deprecated Prefer widget-specific fetchers; kept for aggregate tests. */
export async function fetchDashboardOverview(
  storeId: string,
): Promise<DashboardOverview> {
  const [kpis, recentOrders, lowStock, recentActivity] = await Promise.all([
    fetchDashboardKpis(storeId),
    fetchDashboardRecentOrders(storeId),
    fetchDashboardLowStock(storeId),
    fetchDashboardRecentActivity(storeId),
  ]);

  return {
    kpis,
    recentOrders,
    lowStock,
    recentActivity,
  };
}
