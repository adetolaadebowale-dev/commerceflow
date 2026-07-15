import { describe, expect, it } from "vitest";

import { CYCLE_COUNT_ERROR_CODES } from "../errors";
import { CycleCountStatusTransitionPolicy } from "../policies/cycle-count-status-transition.policy";
import {
  createMemoryCycleCountModule,
  seedCompletedCycleCount,
  seedCountingCycleCount,
  seedDraftCycleCount,
  TEST_STORE_A_ID,
  TEST_STORE_B_ID,
} from "../testing/cycle-count-test-utils";

const TEST_USER_ID = "99999999-9999-9999-9999-999999999999";

describe("CycleCountStatusTransitionPolicy", () => {
  it("allows draft → counting → completed → approved", () => {
    expect(CycleCountStatusTransitionPolicy.canTransition("draft", "counting")).toBe(
      true,
    );
    expect(
      CycleCountStatusTransitionPolicy.canTransition("counting", "completed"),
    ).toBe(true);
    expect(
      CycleCountStatusTransitionPolicy.canTransition("completed", "approved"),
    ).toBe(true);
    expect(CycleCountStatusTransitionPolicy.isTerminal("approved")).toBe(true);
  });
});

describe("CycleCountService", () => {
  it("creates a draft cycle count with expected quantities", async () => {
    const module = createMemoryCycleCountModule();
    const { inventoryItem, cycleCount } = await seedDraftCycleCount(module, {
      initialQuantity: 12,
    });

    expect(cycleCount.status).toBe("draft");
    expect(cycleCount.cycleCountNumber).toMatch(/^CC-/);
    expect(cycleCount.items[0]).toMatchObject({
      inventoryItemId: inventoryItem.id,
      expectedQuantity: 12,
      countedQuantity: 0,
      variance: 0,
    });
  });

  it("calculates variance on completion", async () => {
    const module = createMemoryCycleCountModule();
    const { cycleCount } = await seedCountingCycleCount(module, {
      initialQuantity: 10,
    });
    const item = cycleCount.items[0]!;

    const completed = await module.cycleCountService.completeCycleCount(
      cycleCount.id,
      {
        storeId: TEST_STORE_A_ID,
        items: [{ cycleCountItemId: item.id, countedQuantity: 8 }],
      },
    );

    expect(completed.status).toBe("completed");
    expect(completed.items[0]).toMatchObject({
      countedQuantity: 8,
      variance: -2,
    });
  });

  it("applies inventory adjustments on approval for non-zero variance", async () => {
    const module = createMemoryCycleCountModule();
    const { inventoryItem, cycleCount } = await seedCompletedCycleCount(module, {
      initialQuantity: 10,
      countedQuantity: 7,
    });

    const result = await module.cycleCountService.approveCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
      TEST_USER_ID,
    );

    expect(result.cycleCount.status).toBe("approved");
    expect(result.adjustments).toHaveLength(1);
    expect(result.stockMovements).toHaveLength(1);
    expect(result.stockMovements[0]).toMatchObject({
      movementType: "adjustment",
      quantity: -3,
    });
    expect(result.cycleCount.items[0]?.adjustmentId).toBeDefined();

    const updated = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(updated?.quantityOnHand).toBe(7);
  });

  it("skips adjustments when variance is zero", async () => {
    const module = createMemoryCycleCountModule();
    const { cycleCount } = await seedCompletedCycleCount(module, {
      initialQuantity: 10,
      countedQuantity: 10,
    });

    const result = await module.cycleCountService.approveCycleCount(
      cycleCount.id,
      { storeId: TEST_STORE_A_ID },
      TEST_USER_ID,
    );

    expect(result.adjustments).toHaveLength(0);
    expect(result.stockMovements).toHaveLength(0);
  });

  it("rejects invalid lifecycle transitions", async () => {
    const module = createMemoryCycleCountModule();
    const { cycleCount } = await seedDraftCycleCount(module);

    await expect(
      module.cycleCountService.completeCycleCount(cycleCount.id, {
        storeId: TEST_STORE_A_ID,
        items: [
          {
            cycleCountItemId: cycleCount.items[0]!.id,
            countedQuantity: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: CYCLE_COUNT_ERROR_CODES.INVALID_STATUS_TRANSITION,
      status: 409,
    });
  });

  it("treats completed and approved cycle counts as immutable", async () => {
    const module = createMemoryCycleCountModule();
    const { cycleCount } = await seedCompletedCycleCount(module, {
      initialQuantity: 5,
      countedQuantity: 4,
    });

    await expect(
      module.cycleCountService.startCycleCount(cycleCount.id, {
        storeId: TEST_STORE_A_ID,
      }),
    ).rejects.toMatchObject({
      code: CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_IMMUTABLE,
      status: 409,
    });
  });

  it("enforces tenant isolation", async () => {
    const module = createMemoryCycleCountModule();
    const { cycleCount } = await seedDraftCycleCount(module);

    await expect(
      module.cycleCountService.getCycleCount(
        { storeId: TEST_STORE_B_ID },
        cycleCount.id,
      ),
    ).rejects.toMatchObject({
      code: CYCLE_COUNT_ERROR_CODES.CYCLE_COUNT_NOT_FOUND,
      status: 404,
    });
  });

  it("rolls back approval when stock would go negative", async () => {
    const module = createMemoryCycleCountModule();
    const { inventoryItem, cycleCount } = await seedCountingCycleCount(module, {
      initialQuantity: 10,
    });

    await module.inventoryItemRepository.adjustStock({
      storeId: TEST_STORE_A_ID,
      inventoryItemId: inventoryItem.id,
      quantityChange: -9,
      reason: "manual_adjustment",
    });

    const item = cycleCount.items[0]!;

    await module.cycleCountService.completeCycleCount(cycleCount.id, {
      storeId: TEST_STORE_A_ID,
      items: [{ cycleCountItemId: item.id, countedQuantity: 0 }],
    });

    await expect(
      module.cycleCountService.approveCycleCount(
        cycleCount.id,
        { storeId: TEST_STORE_A_ID },
        TEST_USER_ID,
      ),
    ).rejects.toMatchObject({
      code: CYCLE_COUNT_ERROR_CODES.INSUFFICIENT_STOCK,
      status: 409,
    });

    const unchanged = await module.inventoryItemRepository.findById(
      TEST_STORE_A_ID,
      inventoryItem.id,
    );

    expect(unchanged?.quantityOnHand).toBe(1);
  });
});
