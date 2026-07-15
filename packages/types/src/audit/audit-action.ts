/** Administrative actions recorded in the audit log. */
export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "adjust",
  "confirm",
  "cancel",
  "fulfill",
  "release",
  "checkout",
  "authorize",
  "mark_paid",
  "fail",
  "issue",
  "void",
  "complete",
  "apply",
  "remove",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
