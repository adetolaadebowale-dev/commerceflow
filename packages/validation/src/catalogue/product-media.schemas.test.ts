import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { PRODUCT_MEDIA_MAX_BYTES } from "@commerceflow/types";

import {
  assertProductMediaFileConstraints,
  productMediaUploadMetaSchema,
  reorderProductMediaSchema,
} from "./product-media.schemas";

describe("product media schemas", () => {
  it("accepts optional alt text", () => {
    expect(productMediaUploadMetaSchema.parse({})).toEqual({});
    expect(
      productMediaUploadMetaSchema.parse({ altText: " Front view " }),
    ).toEqual({ altText: "Front view" });
  });

  it("validates reorder payload", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      reorderProductMediaSchema.parse({ orderedMediaIds: [id] }),
    ).toEqual({ orderedMediaIds: [id] });
  });

  it("rejects unsupported mime types and oversized files", () => {
    expect(() =>
      assertProductMediaFileConstraints({
        mimeType: "application/pdf",
        sizeBytes: 100,
      }),
    ).toThrow(ZodError);

    expect(() =>
      assertProductMediaFileConstraints({
        mimeType: "image/png",
        sizeBytes: PRODUCT_MEDIA_MAX_BYTES + 1,
      }),
    ).toThrow(ZodError);
  });
});
