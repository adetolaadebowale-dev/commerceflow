/**
 * Granular authorization grant assigned to a role or user.
 */
export interface Permission {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
}
