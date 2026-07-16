import { JOB_STATUSES, JOB_TYPES } from "@commerceflow/types";
import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");

const jobPayloadSchema = z.record(z.unknown());

const scheduledForSchema = z
  .string()
  .datetime({ message: "scheduledFor must be a valid ISO datetime" })
  .optional();

export const createJobSchema = z.object({
  storeId: storeIdSchema,
  type: z.enum(JOB_TYPES),
  payload: jobPayloadSchema.default({}),
  scheduledFor: scheduledForSchema,
});

export const listJobsQuerySchema = z.object({
  storeId: storeIdSchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(JOB_STATUSES).optional(),
  type: z.enum(JOB_TYPES).optional(),
});

export const jobIdQuerySchema = z.object({
  storeId: storeIdSchema,
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
