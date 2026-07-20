import { describe, expect, it } from "vitest";
import type { InventoryReservation, Order } from "@commerceflow/types";

import {
  buildOrderTimeline,
  getAvailableOrderActions,
} from "@/features/orders/order-utils";

const baseOrder: Order = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  storeId: "11111111-1111-1111-1111-111111111111",
  orderNumber: "ORD-1001",
  status: "draft",
  subtotal: "50.00",
  total: "50.00",
  currency: "USD",
  items: [],
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const activeReservation: InventoryReservation = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  storeId: baseOrder.storeId,
  orderId: baseOrder.id,
  orderItemId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  inventoryItemId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  reservedQuantity: 2,
  status: "active",
  createdAt: "2026-07-20T11:00:00.000Z",
};

describe("order-utils", () => {
  it("exposes confirm and cancel for draft orders", () => {
    expect(getAvailableOrderActions(baseOrder, [])).toEqual([
      "confirm",
      "cancel",
    ]);
  });

  it("exposes reserve when confirmed without active reservations", () => {
    expect(
      getAvailableOrderActions({ ...baseOrder, status: "confirmed" }, []),
    ).toEqual(["cancel", "reserve"]);
  });

  it("exposes fulfill when confirmed with active reservations", () => {
    expect(
      getAvailableOrderActions(
        { ...baseOrder, status: "confirmed" },
        [activeReservation],
      ),
    ).toEqual(["cancel", "fulfill"]);
  });

  it("hides lifecycle actions for fulfilled orders", () => {
    expect(
      getAvailableOrderActions({ ...baseOrder, status: "fulfilled" }, []),
    ).toEqual([]);
  });

  it("builds timeline events from timestamps", () => {
    const events = buildOrderTimeline({
      ...baseOrder,
      status: "confirmed",
      confirmedAt: "2026-07-20T11:00:00.000Z",
    });
    expect(events.map((event) => event.key)).toEqual([
      "created",
      "confirmed",
    ]);
    expect(events[1]?.complete).toBe(true);
  });
});
