import { describe, expect, it } from "vitest";

import { GET, PATCH, POST, DELETE } from "@/app/api/products/[...path]/route";
import {
  handleListProductMedia,
  handleUploadProductMedia,
} from "./product-media.route";
import { TEST_STORE_A_ID } from "../testing/catalogue-test-utils";

const PRODUCT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("product media routes", () => {
  it("rejects list requests without storeId", async () => {
    const response = await handleListProductMedia(
      PRODUCT_ID,
      new Request(`http://localhost/api/products/${PRODUCT_ID}/media`),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("CATALOGUE_VALIDATION_ERROR");
  });

  it("rejects upload requests without storeId before multipart parsing", async () => {
    const response = await handleUploadProductMedia(
      PRODUCT_ID,
      new Request(`http://localhost/api/products/${PRODUCT_ID}/media`, {
        method: "POST",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("dispatches catch-all list path and unknown paths", async () => {
    const listResponse = await GET(
      new Request(
        `http://localhost/api/products/${PRODUCT_ID}/media?storeId=${TEST_STORE_A_ID}`,
      ),
      { params: Promise.resolve({ path: [PRODUCT_ID, "media"] }) },
    );
    // Authorized request without a session fails with an auth error, not 404.
    expect(listResponse.status).not.toBe(404);

    const missing = await GET(new Request("http://localhost/api/products/x/y"), {
      params: Promise.resolve({ path: ["x", "y"] }),
    });
    expect(missing.status).toBe(404);
  });

  it("dispatches catch-all media mutation paths", async () => {
    const post = await POST(
      new Request(
        `http://localhost/api/products/${PRODUCT_ID}/media?storeId=${TEST_STORE_A_ID}`,
        { method: "POST" },
      ),
      { params: Promise.resolve({ path: [PRODUCT_ID, "media"] }) },
    );
    expect(post.status).not.toBe(404);

    const del = await DELETE(
      new Request(
        `http://localhost/api/products/${PRODUCT_ID}/media/${PRODUCT_ID}?storeId=${TEST_STORE_A_ID}`,
        { method: "DELETE" },
      ),
      {
        params: Promise.resolve({
          path: [PRODUCT_ID, "media", PRODUCT_ID],
        }),
      },
    );
    expect(del.status).not.toBe(404);

    const patch = await PATCH(
      new Request(
        `http://localhost/api/products/${PRODUCT_ID}/media/order?storeId=${TEST_STORE_A_ID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedMediaIds: [PRODUCT_ID] }),
        },
      ),
      {
        params: Promise.resolve({
          path: [PRODUCT_ID, "media", "order"],
        }),
      },
    );
    expect(patch.status).not.toBe(404);
  });
});
