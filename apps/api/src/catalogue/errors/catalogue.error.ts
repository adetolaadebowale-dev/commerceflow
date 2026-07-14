import type { CatalogueErrorCode } from "./catalogue-error-codes";

export class CatalogueError extends Error {
  constructor(
    public readonly code: CatalogueErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "CatalogueError";
  }
}
