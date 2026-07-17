import {
  handleCreateApiKey,
  handleListApiKeys,
} from "@/api-keys/routes/api-keys.route";

export async function GET(request: Request): Promise<Response> {
  return handleListApiKeys(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateApiKey(request);
}
