import {
  handleActivateTaxRate,
  handleCreateTaxRate,
  handleDeactivateTaxRate,
  handleDeleteTaxRate,
  handleGetTaxRate,
  handleListTaxRates,
  handleUpdateTaxRate,
} from "@/tax-rates/routes/tax-rates.route";

export async function GET(request: Request) {
  return handleListTaxRates(request);
}

export async function POST(request: Request) {
  return handleCreateTaxRate(request);
}

export {
  handleGetTaxRate,
  handleUpdateTaxRate,
  handleDeleteTaxRate,
  handleActivateTaxRate,
  handleDeactivateTaxRate,
};
