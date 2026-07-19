import { describe, expect, it, vi } from "vitest";

import { createTestDomainEventPublisher } from "@/domain-events/testing/domain-events-test-utils";
import { MemoryStorageProvider } from "@/storage";
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

describe("ProductMediaService domain events", () => {
  async function setup() {
    const { productService, categoryService, productRepository } =
      createMemoryCatalogueServices();
    const category = await categoryService.createCategory(validCategoryInput());
    const product = await productService.createProduct(
      validProductInput(category.id),
    );
    const { dispatcher, publisher } = createTestDomainEventPublisher();
    const service = new ProductMediaService({
      productRepository,
      productMediaRepository: new MemoryProductMediaRepository(),
      storageProvider: new MemoryStorageProvider(),
      domainEventPublisher: publisher,
    });
    return { service, product, dispatcher };
  }

  it("emits product.media.uploaded after upload", async () => {
    const { service, product, dispatcher } = await setup();
    const handler = vi.fn();
    dispatcher.subscribe("product.media.uploaded", handler);

    const media = await service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
      buffer: pngBytes(),
      mimeType: "image/png",
      originalFilename: "a.png",
      sizeBytes: pngBytes().byteLength,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });
    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      eventType: "product.media.uploaded",
      aggregateId: media.id,
      payload: { mediaId: media.id, productId: product.id },
    });
  });

  it("emits product.media.deleted after delete", async () => {
    const { service, product, dispatcher } = await setup();
    const handler = vi.fn();
    dispatcher.subscribe("product.media.deleted", handler);

    const media = await service.uploadProductMedia(TEST_STORE_A_ID, product.id, {
      buffer: pngBytes(),
      mimeType: "image/png",
      originalFilename: "a.png",
      sizeBytes: pngBytes().byteLength,
    });

    await service.deleteProductMedia(TEST_STORE_A_ID, product.id, media.id);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledOnce();
    });
    expect(handler.mock.calls[0]?.[0].eventType).toBe("product.media.deleted");
  });
});
