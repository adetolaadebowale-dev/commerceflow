import { describe, expect, it } from "vitest";

import { MemoryProductMediaRepository } from "./memory-product-media.repository";
import { TEST_STORE_A_ID, TEST_STORE_B_ID } from "../testing/catalogue-test-utils";

const PRODUCT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    storeId: TEST_STORE_A_ID,
    productId: PRODUCT_ID,
    storageKey: `stores/${TEST_STORE_A_ID}/products/${PRODUCT_ID}/file.png`,
    originalFilename: "file.png",
    mimeType: "image/png",
    sizeBytes: 128,
    sortOrder: 0,
    ...overrides,
  };
}

describe("MemoryProductMediaRepository", () => {
  it("creates, lists, and deletes media in upload order", async () => {
    const repository = new MemoryProductMediaRepository();

    const first = await repository.create(createInput({ sortOrder: 0 }));
    const second = await repository.create(
      createInput({
        sortOrder: 1,
        storageKey: `stores/${TEST_STORE_A_ID}/products/${PRODUCT_ID}/b.jpg`,
        originalFilename: "b.jpg",
        mimeType: "image/jpeg",
      }),
    );

    const listed = await repository.listByProductId(TEST_STORE_A_ID, PRODUCT_ID);
    expect(listed.map((item) => item.id)).toEqual([first.id, second.id]);

    await repository.delete(TEST_STORE_A_ID, PRODUCT_ID, first.id);
    expect(await repository.countByProductId(TEST_STORE_A_ID, PRODUCT_ID)).toBe(1);
  });

  it("isolates media by store", async () => {
    const repository = new MemoryProductMediaRepository();
    const created = await repository.create(createInput());

    await expect(
      repository.findById(TEST_STORE_B_ID, PRODUCT_ID, created.id),
    ).resolves.toBeNull();
  });

  it("reorders media by ordered ids", async () => {
    const repository = new MemoryProductMediaRepository();
    const first = await repository.create(createInput({ sortOrder: 0 }));
    const second = await repository.create(
      createInput({
        sortOrder: 1,
        storageKey: `stores/${TEST_STORE_A_ID}/products/${PRODUCT_ID}/b.png`,
      }),
    );

    const reordered = await repository.reorder(TEST_STORE_A_ID, PRODUCT_ID, [
      second.id,
      first.id,
    ]);

    expect(reordered.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(reordered.map((item) => item.sortOrder)).toEqual([0, 1]);
  });
});
