export function getQueryParams(request: Request): Record<string, string> {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}
