import {
  PRODUCT_MEDIA_MAX_BYTES,
  PRODUCT_MEDIA_MIME_TYPES,
  type ProductMediaMimeType,
} from "@commerceflow/types";
import { z } from "zod";

export const productMediaIdQuerySchema = z.object({
  storeId: z.string().uuid("Store id must be a valid UUID"),
});

export const productMediaAltTextSchema = z
  .string()
  .trim()
  .max(500, "Alt text must be at most 500 characters")
  .optional();

const mimeTypeTuple = PRODUCT_MEDIA_MIME_TYPES as unknown as [
  ProductMediaMimeType,
  ...ProductMediaMimeType[],
];

export const productMediaMimeTypeSchema = z.enum(mimeTypeTuple, {
  errorMap: () => ({
    message: `MIME type must be one of: ${PRODUCT_MEDIA_MIME_TYPES.join(", ")}`,
  }),
});

export const productMediaUploadMetaSchema = z.object({
  altText: productMediaAltTextSchema,
});

export const reorderProductMediaSchema = z.object({
  orderedMediaIds: z
    .array(z.string().uuid("Media id must be a valid UUID"))
    .min(1, "At least one media id is required"),
});

export function assertProductMediaFileConstraints(input: {
  readonly mimeType: string;
  readonly sizeBytes: number;
}): void {
  productMediaMimeTypeSchema.parse(input.mimeType);
  if (input.sizeBytes <= 0) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["sizeBytes"],
        message: "File must not be empty",
      },
    ]);
  }
  if (input.sizeBytes > PRODUCT_MEDIA_MAX_BYTES) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["sizeBytes"],
        message: `File must be at most ${PRODUCT_MEDIA_MAX_BYTES} bytes`,
      },
    ]);
  }
}

export type ProductMediaIdQuery = z.infer<typeof productMediaIdQuerySchema>;
export type ProductMediaUploadMeta = z.infer<typeof productMediaUploadMetaSchema>;
export type ReorderProductMediaInput = z.infer<typeof reorderProductMediaSchema>;
