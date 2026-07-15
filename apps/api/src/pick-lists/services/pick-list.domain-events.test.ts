import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import {
  createMemoryPickListModule,
  fullyPickedItems,
  seedPendingPickList,
  TEST_STORE_A_ID,
} from "../testing/pick-list-test-utils";

describe("PickListService domain events", () => {
  it("emits pick list lifecycle events", async () => {
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const createdHandler = vi.fn();
    const startedHandler = vi.fn();
    const completedHandler = vi.fn();
    const packedHandler = vi.fn();
    dispatcher.subscribe("pick-list.created", createdHandler);
    dispatcher.subscribe("pick-list.started", startedHandler);
    dispatcher.subscribe("pick-list.completed", completedHandler);
    dispatcher.subscribe("pick-list.packed", packedHandler);

    const module = createMemoryPickListModule({
      domainEventPublisher: publisher,
    });
    const { pickList } = await seedPendingPickList(module);

    await module.pickListService.startPicking(TEST_STORE_A_ID, pickList.id);
    await module.pickListService.completePicking(
      TEST_STORE_A_ID,
      pickList.id,
      fullyPickedItems(pickList),
    );
    await module.pickListService.markPacked(TEST_STORE_A_ID, pickList.id);

    await vi.waitFor(() => {
      expect(createdHandler).toHaveBeenCalledOnce();
      expect(startedHandler).toHaveBeenCalledOnce();
      expect(completedHandler).toHaveBeenCalledOnce();
      expect(packedHandler).toHaveBeenCalledOnce();
    });

    expect(createdHandler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "pick-list.created",
      aggregateId: pickList.id,
      storeId: TEST_STORE_A_ID,
    });
  });
});
