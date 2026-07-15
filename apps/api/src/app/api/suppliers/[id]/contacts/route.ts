import { handleCreateSupplierContact } from "@/suppliers/routes/suppliers.route";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleCreateSupplierContact(id, request);
}
