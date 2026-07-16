import type { JobErrorCode } from "./job-error-codes";

export class JobError extends Error {
  constructor(
    readonly code: JobErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "JobError";
  }
}
