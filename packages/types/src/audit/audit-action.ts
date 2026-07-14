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
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
