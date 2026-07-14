import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryCustomerAddressService,
  createMemoryCustomerModule,
  TEST_STORE_A_ID,
  validCustomerAddressInput,
  validCustomerInput,
} from "../testing/customer-test-utils";

describe("CustomerAddressService domain events", () => {
  it("emits customer.address.created after successful creation", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("customer.address.created", handler);

    const { customerService, customerAddressService } =
      createMemoryCustomerModule({
        domainEventPublisher: publisher,
      });
    const customer = await customerService.createCustomer(validCustomerInput());

    const address = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput(),
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "customer.address.created",
      aggregateId: address.id,
      storeId: TEST_STORE_A_ID,
      payload: {
        customerAddressId: address.id,
        customerId: customer.id,
      },
    });
  });

  it("emits customer.address.updated after successful update", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("customer.address.updated", handler);

    const { customerService, customerAddressService } =
      createMemoryCustomerModule({
        domainEventPublisher: publisher,
      });
    const customer = await customerService.createCustomer(validCustomerInput());
    const address = await customerAddressService.createCustomerAddress(
      TEST_STORE_A_ID,
      customer.id,
      validCustomerAddressInput(),
    );

    await customerAddressService.updateCustomerAddress(
      TEST_STORE_A_ID,
      address.id,
      { label: "Office" },
    );

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });

    expect(handler.mock.calls[0]?.[0].eventType).toBe("customer.address.updated");
  });

  it("does not emit events when creation fails", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const handler = vi.fn();
    dispatcher.subscribe("customer.address.created", handler);

    const { customerAddressService } = createMemoryCustomerAddressService({
      domainEventPublisher: publisher,
    });

    await expect(
      customerAddressService.createCustomerAddress(
        TEST_STORE_A_ID,
        "00000000-0000-0000-0000-000000000000",
        validCustomerAddressInput(),
      ),
    ).rejects.toMatchObject({
      status: 404,
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
