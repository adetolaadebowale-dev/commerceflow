import { PrismaAuditLogRepository } from "./prisma-audit-log.repository";
import type { AuditLogRepository } from "./audit-log.repository";
import { prisma } from "@/lib/prisma";

const auditLogRepository: AuditLogRepository = new PrismaAuditLogRepository(
  prisma,
);

export function getAuditLogRepository(): AuditLogRepository {
  return auditLogRepository;
}

export type { AuditLogRepository, CreateAuditLogInput } from "./audit-log.repository";
