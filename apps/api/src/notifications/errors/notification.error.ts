import type { NotificationErrorCode } from "./notification-error-codes";

export class NotificationError extends Error {
  constructor(
    readonly code: NotificationErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "NotificationError";
  }
}
