function toCents(amount: string): number {
  const [wholePart, fractionalPart = "00"] = amount.split(".");
  const whole = Number.parseInt(wholePart, 10);
  const fraction = Number.parseInt(fractionalPart.padEnd(2, "0").slice(0, 2), 10);

  return whole * 100 + fraction;
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function multiplyPrice(unitPrice: string, quantity: number): string {
  return fromCents(toCents(unitPrice) * quantity);
}

export function sumPrices(amounts: readonly string[]): string {
  return fromCents(amounts.reduce((total, amount) => total + toCents(amount), 0));
}

export function subtractPrice(minuend: string, subtrahend: string): string {
  const result = toCents(minuend) - toCents(subtrahend);
  return fromCents(Math.max(result, 0));
}

export function minPrice(left: string, right: string): string {
  return toCents(left) <= toCents(right) ? left : right;
}

export function calculatePercentageDiscount(
  subtotal: string,
  percentage: string,
): string {
  const discountCents = Math.round(
    (toCents(subtotal) * Number.parseFloat(percentage)) / 100,
  );

  return fromCents(Math.min(discountCents, toCents(subtotal)));
}

export function calculatePromotionDiscount(input: {
  readonly subtotal: string;
  readonly type: "percentage" | "fixed_amount";
  readonly value: string;
  readonly cartCurrency: string;
  readonly promotionCurrency?: string;
}): string {
  if (input.type === "percentage") {
    return calculatePercentageDiscount(input.subtotal, input.value);
  }

  if (input.promotionCurrency && input.promotionCurrency !== input.cartCurrency) {
    return "0.00";
  }

  return minPrice(input.value, input.subtotal);
}

export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `ORD-${datePart}-${suffix}`;
}
