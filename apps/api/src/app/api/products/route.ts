import { handleCreateProduct, handleListProducts } from "@/catalogue/routes/products.route";

export async function GET(request: Request): Promise<Response> {
  return handleListProducts(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateProduct(request);
}
