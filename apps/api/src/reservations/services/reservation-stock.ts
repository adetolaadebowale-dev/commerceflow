export function calculateAvailableQuantity(
  quantityOnHand: number,
  activeReservedQuantity: number,
): number {
  return quantityOnHand - activeReservedQuantity;
}

export function hasAvailableStock(
  quantityOnHand: number,
  activeReservedQuantity: number,
  requestedQuantity: number,
): boolean {
  return (
    calculateAvailableQuantity(quantityOnHand, activeReservedQuantity) >=
    requestedQuantity
  );
}
