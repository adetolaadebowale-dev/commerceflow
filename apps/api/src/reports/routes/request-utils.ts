export function getQueryParams(request: Request): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of new URL(request.url).searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

export function getRepeatedQueryParams(
  request: Request,
  key: string,
): string[] | undefined {
  const values = new URL(request.url).searchParams.getAll(key);

  return values.length > 0 ? values : undefined;
}
