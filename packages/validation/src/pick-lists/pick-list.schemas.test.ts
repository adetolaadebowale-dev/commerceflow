import { describe, expect, it } from "vitest";

import {
  createPickListSchema,
  updatePickListSchema,
} from "./pick-list.schemas";

describe("pick list schemas", () => {
  it("validates create pick list input", () => {
    const parsed = createPickListSchema.safeParse({
      assignedToUserId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    });

    expect(parsed.success).toBe(true);
  });

  it("validates update pick list input with item quantities", () => {
    const parsed = updatePickListSchema.safeParse({
      items: [
        {
          orderItemId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          quantityPicked: 2,
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty update pick list input", () => {
    const parsed = updatePickListSchema.safeParse({});

    expect(parsed.success).toBe(false);
  });
});
