import type {
  AuditAction,
  AuditEntityType,
  AuditLog,
  CatalogueListResult,
} from "@commerceflow/types";
import type { ListAuditLogsQuery } from "@commerceflow/validation";

export interface CreateAuditLogInput {
  readonly storeId: string | null;
  readonly userId: string;
  readonly sessionId: string;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly action: AuditAction;
  readonly metadata?: Record<string, unknown> | null;
}

export interface AuditLogRepository {
  create(input: CreateAuditLogInput): Promise<AuditLog>;
  findById(storeId: string, id: string): Promise<AuditLog | null>;
  list(query: ListAuditLogsQuery): Promise<CatalogueListResult<AuditLog>>;
}
