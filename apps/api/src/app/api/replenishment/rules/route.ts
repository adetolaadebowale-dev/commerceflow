import {
  handleCreateReplenishmentRule,
  handleListReplenishmentRules,
} from "@/replenishment/routes/replenishment.route";

export async function GET(request: Request) {
  return handleListReplenishmentRules(request);
}

export async function POST(request: Request) {
  return handleCreateReplenishmentRule(request);
}
