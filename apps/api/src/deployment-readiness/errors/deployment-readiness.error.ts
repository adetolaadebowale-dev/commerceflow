import type { DeploymentReadinessErrorCode } from "./deployment-readiness-error-codes";

export class DeploymentReadinessError extends Error {
  constructor(
    readonly code: DeploymentReadinessErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "DeploymentReadinessError";
  }
}
