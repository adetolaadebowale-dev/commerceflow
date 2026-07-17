import type { NotificationPreferenceErrorCode } from "./notification-preference-error-codes";

export class NotificationPreferenceError extends Error {
  constructor(
    readonly code: NotificationPreferenceErrorCode,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "NotificationPreferenceError";
  }
}
