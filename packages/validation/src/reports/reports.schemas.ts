import { z } from "zod";

const storeIdSchema = z.string().uuid("Store id must be a valid UUID");
const timezoneSchema = z
  .string()
  .min(1, "Timezone is required")
  .max(64, "Timezone must be at most 64 characters");
const currencySchema = z
  .string()
  .length(3, "Currency must be a 3-letter ISO code")
  .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO 4217");

export const reportDateRangeSchema = z
  .object({
    from: z.string().datetime({ message: "from must be an ISO-8601 datetime" }),
    to: z.string().datetime({ message: "to must be an ISO-8601 datetime" }),
    timezone: timezoneSchema,
  })
  .refine(
    (value) => value.from.localeCompare(value.to) <= 0,
    "from must be before or equal to to",
  );

export const reportPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reportSortSchema = z.object({
  sortBy: z.string().min(1).max(64).default("generatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const reportGroupingSchema = z.object({
  groupBy: z.string().min(1).max(64),
});

export const reportWarehouseFilterSchema = z.object({
  warehouseIds: z
    .array(z.string().uuid("Warehouse id must be a valid UUID"))
    .min(1)
    .optional(),
});

const reportFilterBaseSchema = z.object({
  storeId: storeIdSchema,
  warehouseIds: z.array(z.string().uuid()).optional(),
  fromDate: z
    .string()
    .datetime({ message: "fromDate must be an ISO-8601 datetime" })
    .optional(),
  toDate: z
    .string()
    .datetime({ message: "toDate must be an ISO-8601 datetime" })
    .optional(),
  timezone: timezoneSchema.optional(),
  currency: currencySchema.optional(),
});

function validateReportDateOrder(value: {
  fromDate?: string;
  toDate?: string;
}) {
  if (!value.fromDate || !value.toDate) {
    return true;
  }

  return value.fromDate.localeCompare(value.toDate) <= 0;
}

export const reportFilterSchema = reportFilterBaseSchema.refine(
  validateReportDateOrder,
  "fromDate must be before or equal to toDate",
);

export const reportHealthQuerySchema = z.object({
  storeId: storeIdSchema,
});

export const reportDashboardQuerySchema = reportFilterBaseSchema
  .merge(reportPaginationSchema)
  .merge(reportSortSchema)
  .merge(reportGroupingSchema.partial())
  .refine(
    validateReportDateOrder,
    "fromDate must be before or equal to toDate",
  );

export type ReportDateRangeInput = z.infer<typeof reportDateRangeSchema>;
export type ReportPaginationInput = z.infer<typeof reportPaginationSchema>;
export type ReportSortInput = z.infer<typeof reportSortSchema>;
export type ReportGroupingInput = z.infer<typeof reportGroupingSchema>;
export type ReportWarehouseFilterInput = z.infer<
  typeof reportWarehouseFilterSchema
>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
export type ReportHealthQuery = z.infer<typeof reportHealthQuerySchema>;
export type ReportDashboardQuery = z.infer<typeof reportDashboardQuerySchema>;
