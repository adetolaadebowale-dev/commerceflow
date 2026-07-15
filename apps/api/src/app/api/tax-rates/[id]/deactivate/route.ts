import { handleDeactivateTaxRate } from "@/tax-rates/routes/tax-rates.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleDeactivateTaxRate(id, request);
}
