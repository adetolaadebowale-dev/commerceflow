/**
 * Paginated list payload shared by catalogue list endpoints.
 */
export interface CatalogueListResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export function buildCatalogueListResult<T>(input: {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}): CatalogueListResult<T> {
  return {
    items: input.items,
    total: input.total,
    page: input.page,
    limit: input.limit,
    totalPages: input.limit > 0 ? Math.ceil(input.total / input.limit) : 0,
  };
}
