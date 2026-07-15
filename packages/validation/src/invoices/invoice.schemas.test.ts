import { describe, expect, it } from "vitest";

import { createInvoiceSchema } from "./invoice.schemas";

describe("invoice.schemas", () => {
  it("accepts empty create invoice input", () => {
    const result = createInvoiceSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts optional dueAt datetime", () => {
    const result = createInvoiceSchema.safeParse({
      dueAt: "2026-08-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid dueAt", () => {
    const result = createInvoiceSchema.safeParse({ dueAt: "not-a-date" });
    expect(result.success).toBe(false);
  });
});
