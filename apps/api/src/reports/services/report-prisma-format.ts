/** Format Prisma Decimal (or nullish) as a money string for report facts. */
export function decimalToMoneyString(
  value: { toString(): string } | null | undefined,
): string {
  if (value == null) {
    return "0.00";
  }

  return value.toString();
}

/** ISO timestamp helper for Prisma DateTime columns. */
export function toIso(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}
