export function getQueryParams(request: Request): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return params;
}
