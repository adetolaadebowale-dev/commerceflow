import type { AuditAction } from "./audit-action";
import type { AuditEntityType } from "./audit-entity-type";

/** Immutable record of an authenticated administrative action. */
export interface AuditLog {
  readonly id: string;
  readonly storeId: string | null;
  readonly userId: string;
  readonly sessionId: string;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly action: AuditAction;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}
