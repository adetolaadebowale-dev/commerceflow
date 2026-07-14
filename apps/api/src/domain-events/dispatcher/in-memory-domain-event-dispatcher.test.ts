import { describe, expect, it, vi } from "vitest";

import {
  createTestDomainEventPublisher,
  sampleDomainEvent,
} from "../testing/domain-events-test-utils";

describe("InMemoryDomainEventDispatcher", () => {
  it("dispatches events to subscribed handlers", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    const event = sampleDomainEvent();

    dispatcher.subscribe("order.confirmed", handler);
    await dispatcher.publish(event);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("invokes multiple handlers for the same event type", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const first = vi.fn();
    const second = vi.fn();
    const event = sampleDomainEvent();

    dispatcher.subscribe("order.confirmed", first);
    dispatcher.subscribe("order.confirmed", second);
    await dispatcher.publish(event);

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("isolates handler failures so other handlers still run", async () => {
    const failures: unknown[] = [];
    const { dispatcher } = createTestDomainEventPublisher({
      onHandlerFailure: (error) => {
        failures.push(error);
      },
    });
    const failing = vi.fn(() => {
      throw new Error("handler failed");
    });
    const succeeding = vi.fn();
    const event = sampleDomainEvent();

    dispatcher.subscribe("order.confirmed", failing);
    dispatcher.subscribe("order.confirmed", succeeding);

    await expect(dispatcher.publish(event)).resolves.toBeUndefined();

    expect(failing).toHaveBeenCalledOnce();
    expect(succeeding).toHaveBeenCalledOnce();
    expect(failures).toHaveLength(1);
  });

  it("delivers events to handlers in subscription order", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const order: number[] = [];
    const event = sampleDomainEvent();

    dispatcher.subscribe("order.confirmed", () => {
      order.push(1);
    });
    dispatcher.subscribe("order.confirmed", () => {
      order.push(2);
    });
    dispatcher.subscribe("order.confirmed", () => {
      order.push(3);
    });

    await dispatcher.publish(event);

    expect(order).toEqual([1, 2, 3]);
  });

  it("does not invoke handlers for other event types", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    const handler = vi.fn();

    dispatcher.subscribe("order.cancelled", handler);
    await dispatcher.publish(sampleDomainEvent({ eventType: "order.confirmed" }));

    expect(handler).not.toHaveBeenCalled();
  });

  it("preserves event payload correctness", async () => {
    const { dispatcher } = createTestDomainEventPublisher();
    let received: unknown;

    dispatcher.subscribe("inventory.reserved", (event) => {
      received = event;
    });

    const event = sampleDomainEvent({
      eventType: "inventory.reserved",
      aggregateType: "order",
      aggregateId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      payload: {
        orderId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        reservationCount: 2,
        reservations: [],
      },
    });

    await dispatcher.publish(event);

    expect(received).toEqual(event);
    expect(event.payload).toMatchObject({
      orderId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      reservationCount: 2,
    });
  });
});
