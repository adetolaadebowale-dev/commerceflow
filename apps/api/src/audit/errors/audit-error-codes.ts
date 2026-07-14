export const AUDIT_ERROR_CODES = {
  NOT_FOUND: "AUDIT_NOT_FOUND",
  VALIDATION_ERROR: "AUDIT_VALIDATION_ERROR",
} as const;

export type AuditErrorCode =
  (typeof AUDIT_ERROR_CODES)[keyof typeof AUDIT_ERROR_CODES];
