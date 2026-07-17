import type { IndexDefinition } from "@commerceflow/types";

/**
 * Curated inventory of high-value Prisma indexes used for operator review.
 * This is analysis-only and does not create or alter indexes.
 */
export const INDEX_CATALOG: readonly IndexDefinition[] = [
  {
    table: "products",
    name: "products_store_id_status_idx",
    columns: ["store_id", "status"],
    unique: false,
    recommendation: "Supports store-scoped product listing filters",
  },
  {
    table: "products",
    name: "products_store_id_slug_key",
    columns: ["store_id", "slug"],
    unique: true,
    recommendation: "Enforces tenant-unique product slugs",
  },
  {
    table: "orders",
    name: "orders_store_id_status_idx",
    columns: ["store_id", "status"],
    unique: false,
    recommendation: "Supports order queue and status dashboards",
  },
  {
    table: "orders",
    name: "orders_store_id_created_at_idx",
    columns: ["store_id", "created_at"],
    unique: false,
    recommendation: "Supports chronological order listing",
  },
  {
    table: "inventory_items",
    name: "inventory_items_store_id_sku_key",
    columns: ["store_id", "sku"],
    unique: true,
    recommendation: "Enforces tenant-unique SKUs for inventory lookups",
  },
  {
    table: "jobs",
    name: "jobs_store_id_status_idx",
    columns: ["store_id", "status"],
    unique: false,
    recommendation: "Supports background job status summaries",
  },
  {
    table: "jobs",
    name: "jobs_store_id_scheduled_for_idx",
    columns: ["store_id", "scheduled_for"],
    unique: false,
    recommendation: "Supports pending job scheduling scans",
  },
  {
    table: "audit_logs",
    name: "audit_logs_store_id_created_at_idx",
    columns: ["store_id", "created_at"],
    unique: false,
    recommendation: "Supports store audit timeline queries",
  },
  {
    table: "feature_flags",
    name: "feature_flags_store_key_uq",
    columns: ["store_id", "key"],
    unique: true,
    recommendation: "Partial unique index for store-scoped flags",
  },
  {
    table: "webhook_endpoints",
    name: "webhook_endpoints_store_id_enabled_idx",
    columns: ["store_id", "enabled"],
    unique: false,
    recommendation: "Supports enabled endpoint delivery lookups",
  },
  {
    table: "customers",
    name: "customers_store_id_email_idx",
    columns: ["store_id", "email"],
    unique: false,
    recommendation: "Supports customer lookup by email within a store",
  },
  {
    table: "store_members",
    name: "store_members_store_id_user_id_key",
    columns: ["store_id", "user_id"],
    unique: true,
    recommendation: "Supports authorization membership resolution",
  },
];

export const BASELINE_QUERY_RECOMMENDATIONS = [
  {
    code: "tenant-store-id-filter",
    severity: "info" as const,
    message:
      "Ensure hot-path queries filter by store_id and leverage composite store-scoped indexes",
    relatedTable: "stores",
  },
  {
    code: "avoid-unbounded-lists",
    severity: "warn" as const,
    message:
      "Prefer paginated list queries with stable orderBy on indexed columns",
  },
  {
    code: "job-status-aggregation",
    severity: "info" as const,
    message:
      "Use groupBy/count on jobs(store_id, status) instead of loading full job rows for summaries",
    relatedTable: "jobs",
  },
  {
    code: "soft-delete-filters",
    severity: "info" as const,
    message:
      "Combine store_id with deleted_at IS NULL on soft-deleted catalogue tables",
    relatedTable: "products",
  },
];
