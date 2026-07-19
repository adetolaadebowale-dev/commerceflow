export const PRODUCT_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ProductMediaMimeType = (typeof PRODUCT_MEDIA_MIME_TYPES)[number];

/** Default max upload size: 5 MiB. */
export const PRODUCT_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
