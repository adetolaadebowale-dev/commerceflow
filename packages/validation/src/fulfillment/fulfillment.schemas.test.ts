import { describe, expect, it } from "vitest";

import { orderFulfillmentActionSchema } from "./fulfillment.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("fulfillment schemas", () => {
  it("validates order fulfillment action query params", () => {
    const parsed = orderFulfillmentActionSchema.safeParse({
      storeId: TEST_STORE_ID,
    });

    expect(parsed.success).toBe(true);
  });
});
