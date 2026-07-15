import type { DomainEventPublisher } from "@/domain-events";
import { MemoryCycleCountRepository } from "../repositories/memory-cycle-count.repository";
import { CycleCountService } from "../services/cycle-count.service";
import {
  createMemoryInventoryAdjustmentModule,
  seedInventoryItemForAdjustments,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../../inventory-adjustments/testing/inventory-adjustment-test-utils";

export { TEST_STORE_A_ID, TEST_STORE_B_ID };

export type MemoryCycleCountModule = ReturnType<typeof createMemoryCycleCountModule>;

export function createMemoryCycleCountModule(
  dependencies: {
    domainEventPublisher?: DomainEventPublisher;
  } = {},
) {
  const adjustmentModule = createMemoryInventoryAdjustmentModule(dependencies);
  const cycleCountRepository = new MemoryCycleCountRepository(
    adjustmentModule.inventoryItemRepository,
  );

  return {
    ...adjustmentModule,
    cycleCountRepository,
    cycleCountService: new CycleCountService({
      cycleCountRepository,
      inventoryItemRepository: adjustmentModule.inventoryItemRepository,
      ...dependencies,
    }),
  };
}

export async function seedDraftCycleCount(
  module: MemoryCycleCountModule,
  options: { initialQuantity?: number } = {},
) {
  const { inventoryItem } = await seedInventoryItemForAdjustments(module, options);

  const cycleCount = await module.cycleCountService.createCycleCount({
    storeId: TEST_STORE_A_ID,
    inventoryItemIds: [inventoryItem.id],
  });

  return { inventoryItem, cycleCount };
}

export async function seedCountingCycleCount(
  module: MemoryCycleCountModule,
  options: { initialQuantity?: number } = {},
) {
  const seeded = await seedDraftCycleCount(module, options);

  const cycleCount = await module.cycleCountService.startCycleCount(
    seeded.cycleCount.id,
    { storeId: TEST_STORE_A_ID },
  );

  return { ...seeded, cycleCount };
}

export async function seedCompletedCycleCount(
  module: MemoryCycleCountModule,
  options: {
    initialQuantity?: number;
    countedQuantity?: number;
  } = {},
) {
  const seeded = await seedCountingCycleCount(module, options);
  const item = seeded.cycleCount.items[0]!;

  const cycleCount = await module.cycleCountService.completeCycleCount(
    seeded.cycleCount.id,
    {
      storeId: TEST_STORE_A_ID,
      items: [
        {
          cycleCountItemId: item.id,
          countedQuantity: options.countedQuantity ?? item.expectedQuantity,
        },
      ],
    },
  );

  return { ...seeded, cycleCount };
}
