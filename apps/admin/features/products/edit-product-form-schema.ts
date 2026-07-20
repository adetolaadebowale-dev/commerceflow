import {
  createProductFormSchema,
  type CreateProductFormValues,
} from "@/features/products/create-product-form-schema";

/** Edit form shares create field validation (no storeId / variants). */
export const editProductFormSchema = createProductFormSchema;

export type EditProductFormValues = CreateProductFormValues;
