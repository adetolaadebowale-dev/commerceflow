/** Supported data transfer entity types. */
export const DATA_TRANSFER_TYPES = [
  "customers",
  "products",
  "inventory",
] as const;

export type DataTransferType = (typeof DATA_TRANSFER_TYPES)[number];

/** Data transfer job lifecycle statuses. */
export const DATA_TRANSFER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type DataTransferStatus = (typeof DATA_TRANSFER_STATUSES)[number];

/** Supported file formats for import/export jobs. */
export const DATA_TRANSFER_FORMATS = ["csv"] as const;

export type DataTransferFormat = (typeof DATA_TRANSFER_FORMATS)[number];

/** Store-scoped import job record. */
export interface ImportJob {
  readonly id: string;
  readonly storeId: string;
  readonly type: DataTransferType;
  readonly status: DataTransferStatus;
  readonly format: DataTransferFormat;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
}

/** Store-scoped export job record. */
export interface ExportJob {
  readonly id: string;
  readonly storeId: string;
  readonly type: DataTransferType;
  readonly status: DataTransferStatus;
  readonly format: DataTransferFormat;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
}
