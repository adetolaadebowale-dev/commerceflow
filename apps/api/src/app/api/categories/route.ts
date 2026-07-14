import { handleCreateCategory, handleListCategories } from "@/catalogue/routes/categories.route";

export async function GET(request: Request): Promise<Response> {
  return handleListCategories(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateCategory(request);
}
