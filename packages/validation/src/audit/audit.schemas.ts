import { z } from "zod";

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@commerceflow/types";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

export const listAuditLogsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
  entityId: z.string().uuid("Entity id must be a valid UUID").optional(),
  userId: z.string().uuid("User id must be a valid UUID").optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  fromDate: z.string().datetime({ message: "fromDate must be an ISO-8601 datetime" }).optional(),
  toDate: z.string().datetime({ message: "toDate must be an ISO-8601 datetime" }).optional(),
});

export const auditLogIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
