export function getQueryParams(request: Request): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of new URL(request.url).searchParams.entries()) {
    params[key] = value;
  }

  return params;
}
