import type { NotificationProviderType } from "../notification-provider-type";
import type { NotificationResult } from "../notification-result";
import type { NotificationSendRequest } from "./notification-send-request";

/** Provider-agnostic notification delivery contract. */
export interface NotificationProvider {
  readonly provider: NotificationProviderType;

  send(request: NotificationSendRequest): Promise<NotificationResult>;
}
