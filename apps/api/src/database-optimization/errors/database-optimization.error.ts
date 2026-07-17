import type { DatabaseOptimizationErrorCode } from "./database-optimization-error-codes";

export class DatabaseOptimizationError extends Error {
  constructor(
    readonly code: DatabaseOptimizationErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "DatabaseOptimizationError";
  }
}
