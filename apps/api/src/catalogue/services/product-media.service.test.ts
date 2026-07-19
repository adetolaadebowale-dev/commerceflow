import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryStorageProvider } from "@/storage";
import { CATALOGUE_ERROR_CODES } from "../errors";
import { MemoryProductMediaRepository } from "../repositories/memory-product-media.repository";
import { ProductMediaService } from "./product-media.service";
import {
  createMemoryCatalogueServices,
  TEST_STORE_A_ID,
  validCategoryInput,
  validProductInput,
} from "../testing/catalogue-test-utils";

function pngBytes(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
}

describe("ProductMediaService", () => {
  async function setup() {
    const { productService, categoryService, productRepository } =
      createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const product = await productService.createProduct(
      validProductInput(category.id),
    );
    const productMediaRepository = new MemoryProductMediaRepository();
    const storageProvider = new MemoryStorageProvider();
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const service = new ProductMediaService({
      productRepository,
      productMediaRepository,
      storageProvider,
      domainEventPublisher: publisher,
    });

    return {
      service,
      product,
      productMediaRepository,
      storageProvider,
      dispatcher,
    };
  }

  it("uploads media, preserves order, and lists with public urls", async () => {
    const { service, product, storageProvider } = await setup();

    const first = await service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
      buffer: pngBytes(),
      mimeType: "image/png",
      originalFilename: "a.png",
      sizeBytes: pngBytes().byteLength,
    });
    const second = await service.uploadProductMedia(
      TEST_STORE_A_ID,
      product.id,
      {
        buffer: pngBytes(),
        mimeType: "image/png",
        originalFilename: "b.png",
        sizeBytes: pngBytes().byteLength,
      },
      { altText: "Side view" },
    );

    expect(first.sortOrder).toBe(0);
    expect(second.sortOrder).toBe(1);
    expect(second.altText).toBe("Side view");
    expect(storageProvider.getObjectCount()).toBe(2);
    expect(first.url).toContain(encodeURIComponent(first.storageKey.split("/").pop()!));

    const listed = await service.listProductMedia(TEST_STORE_A_ID, product.id);
    expect(listed.items.map((item) => item.id)).toEqual([first.id, second.id]);
  });

  it("rejects unsupported mime types", async () => {
    const { service, product } = await setup();

    await expect(
      service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
        buffer: Buffer.from("%PDF"),
        mimeType: "application/pdf",
        originalFilename: "doc.pdf",
        sizeBytes: 4,
      }),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    });
  });

  it("deletes media from repository and storage", async () => {
    const { service, product, storageProvider } = await setup();
    const media = await service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
      buffer: pngBytes(),
      mimeType: "image/png",
      originalFilename: "a.png",
      sizeBytes: pngBytes().byteLength,
    });

    await service.deleteProductMedia(TEST_STORE_A_ID, product.id, media.id);
    expect(storageProvider.getObjectCount()).toBe(0);

    const listed = await service.listProductMedia(TEST_STORE_A_ID, product.id);
    expect(listed.items).toHaveLength(0);
  });

  it("reorders media and emits domain event", async () => {
    const { service, product, dispatcher } = await setup();
    const handler = vi.fn();
    dispatcher.subscribe("product.media.reordered", handler);

    const first = await service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
      buffer: pngBytes(),
      mimeType: "image/png",
      originalFilename: "a.png",
      sizeBytes: pngBytes().byteLength,
    });
    const second = await service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
      buffer: pngBytes(),
      mimeType: "image/png",
      originalFilename: "b.png",
      sizeBytes: pngBytes().byteLength,
    });

    const result = await service.reorderProductMedia(TEST_STORE_A_ID, product.id, {
      orderedMediaIds: [second.id, first.id],
    });

    expect(result.items.map((item) => item.id)).toEqual([second.id, first.id]);
    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  it("returns not found for missing products", async () => {
    const { service } = await setup();

    await expect(
      service.listProductMedia(
        TEST_STORE_A_ID,
        "00000000-0000-4000-8000-000000000000",
      ),
    ).rejects.toMatchObject({
      code: CATALOGUE_ERROR_CODES.NOT_FOUND,
      status: 404,
    });
  });
});
