import {
  handleCreateShippingZone,
  handleListShippingZones,
} from "@/shipping-configuration/routes/shipping-zones.route";

export async function GET(request: Request): Promise<Response> {
  return handleListShippingZones(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateShippingZone(request);
}
