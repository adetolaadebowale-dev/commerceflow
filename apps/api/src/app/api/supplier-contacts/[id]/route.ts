import {
  handleDeleteSupplierContact,
  handleUpdateSupplierContact,
} from "@/suppliers/routes/suppliers.route";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleUpdateSupplierContact(id, request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleDeleteSupplierContact(id, request);
}
