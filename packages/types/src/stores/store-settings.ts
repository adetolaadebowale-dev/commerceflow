/** Store-level configuration settings. */
export interface StoreSettings {
  readonly defaultCurrency: string;
  readonly defaultTimezone: string;
  readonly locale: string;
}

/** Default store settings applied when none are persisted. */
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  defaultCurrency: "USD",
  defaultTimezone: "UTC",
  locale: "en-US",
};

/** Store configuration exposed by administration APIs. */
export interface StoreConfiguration {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly slug: string;
  readonly settings: StoreSettings;
  readonly createdAt: string;
  readonly updatedAt: string;
}
