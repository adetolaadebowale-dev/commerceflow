import {
  handleDeleteReplenishmentRule,
  handleGetReplenishmentRule,
  handleUpdateReplenishmentRule,
} from "@/replenishment/routes/replenishment.route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleGetReplenishmentRule(id, request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleUpdateReplenishmentRule(id, request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return handleDeleteReplenishmentRule(id, request);
}
