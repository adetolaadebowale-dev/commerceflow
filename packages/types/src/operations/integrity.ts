/** Single integrity or consistency issue detected during operational validation. */
export interface IntegrityIssue {
  readonly code: string;
  readonly message: string;
  readonly entityType?: string;
  readonly entityId?: string;
}

/** Result of an operational integrity validation run. */
export interface IntegrityCheckResult {
  readonly valid: boolean;
  readonly checkedAt: string;
  readonly issues: readonly IntegrityIssue[];
}
