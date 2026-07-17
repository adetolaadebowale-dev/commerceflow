import {
  DATA_TRANSFER_FORMATS,
  DATA_TRANSFER_STATUSES,
  DATA_TRANSFER_TYPES,
} from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const metadataSchema = z.record(z.unknown()).default({});

export const createImportJobSchema = z.object({
  storeId: storeIdSchema,
  type: z.enum(DATA_TRANSFER_TYPES),
  format: z.enum(DATA_TRANSFER_FORMATS).default("csv"),
  metadata: metadataSchema,
});

export const createExportJobSchema = z.object({
  storeId: storeIdSchema,
  type: z.enum(DATA_TRANSFER_TYPES),
  format: z.enum(DATA_TRANSFER_FORMATS).default("csv"),
  metadata: metadataSchema,
});

export const listImportJobsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(DATA_TRANSFER_STATUSES).optional(),
  type: z.enum(DATA_TRANSFER_TYPES).optional(),
});

export const listExportJobsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(DATA_TRANSFER_STATUSES).optional(),
  type: z.enum(DATA_TRANSFER_TYPES).optional(),
});

export const dataTransferJobIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateImportJobInput = z.infer<typeof createImportJobSchema>;
export type CreateExportJobInput = z.infer<typeof createExportJobSchema>;
export type ListImportJobsQuery = z.infer<typeof listImportJobsQuerySchema>;
export type ListExportJobsQuery = z.infer<typeof listExportJobsQuerySchema>;
