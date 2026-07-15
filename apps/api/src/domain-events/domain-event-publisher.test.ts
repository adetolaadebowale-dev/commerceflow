import { describe, expect, it, vi } from "vitest";

import type { Order } from "@commerceflow/types";

import {
  buildOrderCancelledEvent,
  buildOrderConfirmedEvent,
} from "./domain-event-factory";
import { DomainEventPublisher } from "./domain-event-publisher";
import {
  createTestDomainEventPublisher,
  sampleDomainEvent,
} from "./testing/domain-events-test-utils";

const sampleOrder: Order = {
  id: "11111111-1111-1111-1111-111111111111",
  storeId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  orderNumber: "ORD-1001",
  status: "confirmed",
  subtotal: "39.98",
  total: "39.98",
  currency: "USD",
  items: [
    {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      orderId: "11111111-1111-1111-1111-111111111111",
      productVariantId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      productName: "Classic Tee",
      sku: "TEE-001",
      unitPrice: "19.99",
      currency: "USD",
      quantity: 2,
      lineSubtotal: "39.98",
      createdAt: "2026-07-14T11:00:00.000Z",
    },
  ],
  confirmedAt: "2026-07-14T12:00:00.000Z",
  createdAt: "2026-07-14T11:00:00.000Z",
  updatedAt: "2026-07-14T12:00:00.000Z",
};

describe("DomainEventPublisher", () => {
  it("publishes order.confirmed events without throwing", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();

    dispatcher.subscribe("order.confirmed", handler);
    publisher.publishOrderConfirmed(sampleOrder, "draft");

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    const event = handler.mock.calls[0]?.[0];
    expect(event.eventType).toBe("order.confirmed");
    expect(event.payload).toMatchObject({
      orderId: sampleOrder.id,
      previousStatus: "draft",
      status: "confirmed",
      itemCount: 1,
    });
  });

  it("does not throw when dispatch fails unexpectedly", async () => {
    const failures: unknown[] = [];
    const dispatcher = {
      publish: vi.fn(() => Promise.reject(new Error("dispatch failed"))),
      subscribe: vi.fn(),
    };
    const publisher = new DomainEventPublisher({
      dispatcher,
      onDispatchFailure: (error) => {
        failures.push(error);
      },
    });

    expect(() =>
      publisher.publishOrderCancelled(sampleOrder, "confirmed"),
    ).not.toThrow();

    await vi.waitFor(() => {
      expect(failures).toHaveLength(1);
    });
  });
});

describe("domain event factories", () => {
  it("builds order.confirmed events with correct payload", () => {
    const event = buildOrderConfirmedEvent(sampleOrder, "draft");

    expect(event).toMatchObject({
      eventType: "order.confirmed",
      aggregateType: "order",
      aggregateId: sampleOrder.id,
      storeId: sampleOrder.storeId,
      payload: {
        orderId: sampleOrder.id,
        orderNumber: sampleOrder.orderNumber,
        previousStatus: "draft",
        status: "confirmed",
        itemCount: 1,
      },
    });
    expect(event.id).toBeTruthy();
    expect(event.occurredAt).toBeTruthy();
  });

  it("builds order.cancelled events with correct payload", () => {
    const cancelledOrder: Order = {
      ...sampleOrder,
      status: "cancelled",
      cancelledAt: "2026-07-14T13:00:00.000Z",
    };
    const event = buildOrderCancelledEvent(cancelledOrder, "confirmed");

    expect(event.eventType).toBe("order.cancelled");
    expect(event.payload).toMatchObject({
      previousStatus: "confirmed",
      status: "cancelled",
      cancelledAt: cancelledOrder.cancelledAt,
    });
  });

  it("creates domain events with required contract fields", () => {
    const event = sampleDomainEvent();

    expect(event).toMatchObject({
      id: expect.any(String),
      occurredAt: expect.any(String),
      eventType: "order.confirmed",
      aggregateType: "order",
      aggregateId: expect.any(String),
      storeId: expect.any(String),
      payload: expect.any(Object),
    });
  });
});
