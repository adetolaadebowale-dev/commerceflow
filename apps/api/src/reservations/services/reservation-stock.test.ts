import { describe, expect, it } from "vitest";

import {
  calculateAvailableQuantity,
  hasAvailableStock,
} from "./reservation-stock";

describe("reservation stock helpers", () => {
  it("calculates available quantity as on-hand minus active reservations", () => {
    expect(calculateAvailableQuantity(10, 3)).toBe(7);
    expect(calculateAvailableQuantity(10, 0)).toBe(10);
  });

  it("determines whether requested quantity fits available stock", () => {
    expect(hasAvailableStock(10, 3, 7)).toBe(true);
    expect(hasAvailableStock(10, 3, 8)).toBe(false);
    expect(hasAvailableStock(5, 5, 1)).toBe(false);
  });
});
