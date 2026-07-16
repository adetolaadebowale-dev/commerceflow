/** SMS delivery provider adapters available in the foundation layer. */
export const SMS_PROVIDER_TYPES = ["console", "memory"] as const;

export type SmsProviderType = (typeof SMS_PROVIDER_TYPES)[number];
