import { describe, expect, it } from "vitest";

import {
  listOrderReservationsQuerySchema,
  orderReservationActionSchema,
  reservationIdActionSchema,
} from "./reservation.schemas";

const TEST_STORE_ID = "11111111-1111-1111-1111-111111111111";

describe("reservation schemas", () => {
  it("validates order reservation action query params", () => {
    const parsed = orderReservationActionSchema.safeParse({
      storeId: TEST_STORE_ID,
    });

    expect(parsed.success).toBe(true);
  });

  it("validates reservation release action query params", () => {
    const parsed = reservationIdActionSchema.safeParse({
      storeId: TEST_STORE_ID,
    });

    expect(parsed.success).toBe(true);
  });

  it("validates list order reservations query params", () => {
    const parsed = listOrderReservationsQuerySchema.safeParse({
      storeId: TEST_STORE_ID,
    });

    expect(parsed.success).toBe(true);
  });
});
