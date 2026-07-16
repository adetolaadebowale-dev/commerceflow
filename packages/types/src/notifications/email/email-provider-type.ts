/** Email delivery provider adapters available in the foundation layer. */
export const EMAIL_PROVIDER_TYPES = ["console", "memory"] as const;

export type EmailProviderType = (typeof EMAIL_PROVIDER_TYPES)[number];
