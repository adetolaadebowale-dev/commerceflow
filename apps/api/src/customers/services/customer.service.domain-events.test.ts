import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryCustomerService,
  TEST_STORE_A_ID,
  validCustomerInput,
} from "../testing/customer-test-utils";

describe("CustomerService domain events", () => {
  it("emits customer.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("customer.created", handler);

    const { customerService } = createMemoryCustomerService({
      domainEventPublisher: publisher,
    });

    const customer = await customerService.createCustomer(validCustomerInput());

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "customer.created",
      aggregateId: customer.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        customerId: customer.id,
        email: customer.email,
      },
    });
  });

  it("emits customer.updated after successful update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("customer.updated", handler);

    const { customerService } = createMemoryCustomerService({
      domainEventPublisher: publisher,
    });
    const customer = await customerService.createCustomer(validCustomerInput());

    await customerService.updateCustomer(TEST_STORE_A_ID, customer.id, {
      firstName: "Updated",
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("customer.updated");
  });

  it("does not emit events when creation fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("customer.created", handler);

    const { customerService } = createMemoryCustomerService({
      domainEventPublisher: publisher,
    });
    const input = validCustomerInput({ email: "fail@example.com" });

    await customerService.createCustomer(input);

    await expect(customerService.createCustomer(input)).rejects.toMatchObject({
      status: 409,
    });

    expect(handler).toHaveBeenCalledOnce();
  });
});
