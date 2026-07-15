import { handleActivateTaxRate } from "@/tax-rates/routes/tax-rates.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleActivateTaxRate(id, request);
}
