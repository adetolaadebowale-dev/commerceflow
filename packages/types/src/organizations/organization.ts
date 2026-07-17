/** Placeholder organization settings for future expansion. */
export type OrganizationSettings = Readonly<Record<string, unknown>>;

/** Organization tenant metadata shared across stores. */
export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly settings: OrganizationSettings;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Store summary returned by organization administration APIs. */
export interface OrganizationStoreSummary {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly slug: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
