import type { CartItem } from "@commerceflow/types";

import { multiplyPrice, sumPrices } from "@/orders/services/order-pricing";

export function calculateCartTotals(
  items: readonly CartItem[],
): { subtotal: string; currency: string } {
  if (items.length === 0) {
    return { subtotal: "0.00", currency: "USD" };
  }

  return {
    subtotal: sumPrices(items.map((item) => item.lineSubtotal)),
    currency: items[0]?.currencySnapshot ?? "USD",
  };
}

export function buildLineSubtotal(
  unitPriceSnapshot: string,
  quantity: number,
): string {
  return multiplyPrice(unitPriceSnapshot, quantity);
}
