import { describe, expect, it, vi } from "vitest";

import {
  fetchDashboardKpis,
  fetchDashboardLowStock,
  fetchDashboardOverview,
  fetchDashboardRecentActivity,
  fetchDashboardRecentOrders,
} from "@/services/dashboard.service";
import { apiRequest } from "@/services/api-client";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/api-client", () => ({
  apiRequest: vi.fn(),
}));

describe("dashboard service", () => {
  it("maps list and report payloads into dashboard view models", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ items: [], total: 3 })
      .mockResolvedValueOnce({
        items: [
          {
            id: "order-1",
            orderNumber: "ORD-100",
            customerId: "customer-1",
            status: "confirmed",
            total: "25.00",
            currency: "USD",
            createdAt: "2026-07-18T10:00:00.000Z",
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "customer-1",
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        metrics: { inventoryValue: "500.00", currency: "USD" },
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "order-1",
            orderNumber: "ORD-100",
            customerId: "customer-1",
            status: "confirmed",
            total: "25.00",
            currency: "USD",
            createdAt: "2026-07-18T10:00:00.000Z",
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "customer-1",
            email: "ada@example.com",
            firstName: "Ada",
            lastName: "Lovelace",
          },
        ],
        total: 1,
      })
      .mockResolvedValueOnce({
        lowStockItems: [
          {
            inventoryItemId: "inv-1",
            productVariantId: "variant-1",
            quantityAvailable: 2,
            quantityOnHand: 2,
          },
        ],
        outOfStockItems: [],
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "product-1",
            name: "Classic Tee",
            variants: [
              { id: "variant-1", sku: "TEE-001", name: "Default" },
            ],
          },
        ],
        total: 3,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "audit-1",
            userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            action: "order_create",
            createdAt: "2026-07-18T11:00:00.000Z",
          },
        ],
        total: 1,
      });

    const overview = await fetchDashboardOverview(
      "11111111-1111-1111-1111-111111111111",
    );

    expect(overview.kpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Total Products", value: "3" }),
        expect.objectContaining({ label: "Total Orders", value: "1" }),
        expect.objectContaining({ label: "Total Customers", value: "1" }),
      ]),
    );
    expect(overview.recentOrders[0]).toMatchObject({
      orderNumber: "ORD-100",
      customer: "Ada Lovelace",
      status: "confirmed",
    });
    expect(overview.lowStock[0]).toMatchObject({
      product: "Classic Tee",
      sku: "TEE-001",
      remainingQuantity: 2,
    });
    expect(overview.recentActivity[0]?.action).toBe("order create");
  });

  it("keeps remaining KPIs when inventory summary fails", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ items: [], total: 3 })
      .mockResolvedValueOnce({ items: [], total: 2 })
      .mockResolvedValueOnce({ items: [], total: 4 })
      .mockRejectedValueOnce(
        new AdminApiError("NOT_FOUND", "Inventory summary missing", 404),
      );

    const kpis = await fetchDashboardKpis(
      "11111111-1111-1111-1111-111111111111",
    );

    expect(kpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "products", value: "3" }),
        expect.objectContaining({ key: "orders", value: "2" }),
        expect.objectContaining({ key: "customers", value: "4" }),
        expect.objectContaining({
          key: "inventory",
          value: "—",
          error: "Inventory summary missing",
        }),
      ]),
    );
  });

  it("requests the canonical low-stock report route", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        lowStockItems: [],
        outOfStockItems: [],
      })
      .mockResolvedValueOnce({ items: [], total: 0 });

    await fetchDashboardLowStock("11111111-1111-1111-1111-111111111111");

    expect(apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/api/reports/inventory/low-stock",
        params: {
          storeId: "11111111-1111-1111-1111-111111111111",
          page: 1,
          limit: 10,
        },
      }),
    );
  });

  it("loads recent orders and activity independently", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockResolvedValueOnce({ items: [], total: 0 })
      .mockResolvedValueOnce({
        items: [
          {
            id: "audit-1",
            userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            action: "order_create",
            createdAt: "2026-07-18T11:00:00.000Z",
          },
        ],
        total: 1,
      });

    await expect(
      fetchDashboardRecentOrders("11111111-1111-1111-1111-111111111111"),
    ).resolves.toEqual([]);
    await expect(
      fetchDashboardRecentActivity("11111111-1111-1111-1111-111111111111"),
    ).resolves.toEqual([
      expect.objectContaining({ action: "order create" }),
    ]);
  });
});
