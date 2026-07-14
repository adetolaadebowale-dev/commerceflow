import {
  handleCreateBrand,
  handleListBrands,
} from "@/catalogue/routes/brands.route";

export async function GET(request: Request): Promise<Response> {
  return handleListBrands(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateBrand(request);
}
