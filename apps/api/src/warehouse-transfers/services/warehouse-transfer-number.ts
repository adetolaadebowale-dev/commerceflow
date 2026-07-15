export function generateWarehouseTransferNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `XFR-${datePart}-${suffix}`;
}

export function isUniqueWarehouseTransferNumberViolation(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
