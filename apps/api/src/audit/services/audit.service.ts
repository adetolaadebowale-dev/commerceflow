import type {
  AuditAction,
  AuditEntityType,
  AuditLog,
  AuthorizedOrganizationContext,
  AuthorizedStoreContext,
  CatalogueListResult,
} from "@commerceflow/types";
import type { ListAuditLogsQuery } from "@commerceflow/validation";

import { AUDIT_ERROR_CODES, AuditError } from "../errors";
import {
  getAuditLogRepository,
  type AuditLogRepository,
  type CreateAuditLogInput,
} from "../repositories";

export interface RecordAuditInput {
  readonly storeId: string | null;
  readonly userId: string;
  readonly sessionId: string;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly action: AuditAction;
  readonly metadata?: Record<string, unknown> | null;
}

export interface AuditServiceDependencies {
  readonly auditLogRepository?: AuditLogRepository;
  readonly onRecordFailure?: (error: unknown, input: RecordAuditInput) => void;
}

export class AuditService {
  private readonly auditLogRepository: AuditLogRepository;
  private readonly onRecordFailure: (
    error: unknown,
    input: RecordAuditInput,
  ) => void;

  constructor(dependencies: AuditServiceDependencies = {}) {
    this.auditLogRepository =
      dependencies.auditLogRepository ?? getAuditLogRepository();
    this.onRecordFailure =
      dependencies.onRecordFailure ??
      ((error, input) => {
        console.error("Failed to record audit log entry", {
          error,
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
        });
      });
  }

  async record(input: RecordAuditInput): Promise<AuditLog> {
    return this.auditLogRepository.create(input);
  }

  async recordBestEffort(input: RecordAuditInput): Promise<void> {
    try {
      await this.record(input);
    } catch (error) {
      this.onRecordFailure(error, input);
    }
  }

  recordFromAuthContext(
    authContext: AuthorizedStoreContext,
    input: Omit<RecordAuditInput, "storeId" | "userId" | "sessionId">,
  ): void {
    void this.recordBestEffort({
      storeId: authContext.storeId,
      userId: authContext.userId,
      sessionId: authContext.sessionId,
      ...input,
    });
  }

  recordFromOrganizationAuthContext(
    authContext: AuthorizedOrganizationContext,
    input: Omit<RecordAuditInput, "storeId" | "userId" | "sessionId">,
  ): void {
    void this.recordBestEffort({
      storeId: null,
      userId: authContext.userId,
      sessionId: authContext.sessionId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: {
        organizationId: authContext.organizationId,
        ...(input.metadata ?? {}),
      },
    });
  }

  async getAuditLog(storeId: string, id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findById(storeId, id);

    if (!log) {
      throw new AuditError(
        AUDIT_ERROR_CODES.NOT_FOUND,
        "Audit log not found",
        404,
      );
    }

    return log;
  }

  async listAuditLogs(
    query: ListAuditLogsQuery,
  ): Promise<CatalogueListResult<AuditLog>> {
    return this.auditLogRepository.list(query);
  }
}

export const auditService = new AuditService();

export type { CreateAuditLogInput };
