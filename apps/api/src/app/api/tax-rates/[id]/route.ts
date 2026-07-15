import {
  handleActivateTaxRate,
  handleDeactivateTaxRate,
  handleDeleteTaxRate,
  handleGetTaxRate,
  handleUpdateTaxRate,
} from "@/tax-rates/routes/tax-rates.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleGetTaxRate(id, request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleUpdateTaxRate(id, request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleDeleteTaxRate(id, request);
}

export {
  handleActivateTaxRate,
  handleDeactivateTaxRate,
};
