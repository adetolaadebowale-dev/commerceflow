import {
  handleCreateSupplier,
  handleListSuppliers,
} from "@/suppliers/routes/suppliers.route";

export async function GET(request: Request) {
  return handleListSuppliers(request);
}

export async function POST(request: Request) {
  return handleCreateSupplier(request);
}
