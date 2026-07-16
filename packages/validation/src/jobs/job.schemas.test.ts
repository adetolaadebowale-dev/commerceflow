import { describe, expect, it } from "vitest";

import {
  createJobSchema,
  listJobsQuerySchema,
} from "./job.schemas";

describe("job schemas", () => {
  const validUuid = "11111111-1111-1111-1111-111111111111";

  it("accepts a valid create job payload", () => {
    const parsed = createJobSchema.parse({
      storeId: validUuid,
      type: "noop",
      payload: { key: "value" },
      scheduledFor: "2026-12-01T10:00:00.000Z",
    });

    expect(parsed.type).toBe("noop");
    expect(parsed.payload).toEqual({ key: "value" });
  });

  it("defaults payload to an empty object", () => {
    const parsed = createJobSchema.parse({
      storeId: validUuid,
      type: "noop",
    });

    expect(parsed.payload).toEqual({});
  });

  it("accepts list query filters", () => {
    const parsed = listJobsQuerySchema.parse({
      storeId: validUuid,
      status: "pending",
      type: "noop",
      page: "2",
      limit: "10",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.status).toBe("pending");
  });
});
