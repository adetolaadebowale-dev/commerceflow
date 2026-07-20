import type { ProductVariant } from "@commerceflow/types";
import type {
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from "@commerceflow/validation";

/** Persistence record including store scope and soft-delete. */
export interface ProductVariantRecord extends ProductVariant {
  readonly storeId: string;
  readonly deletedAt: string | null;
}

export interface CreateProductVariantRecordInput
  extends CreateProductVariantInput {
  readonly storeId: string;
  readonly productId: string;
}

export interface ProductVariantRepository {
  findById(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductVariantRecord | null>;
  listByProductId(
    storeId: string,
    productId: string,
  ): Promise<readonly ProductVariantRecord[]>;
  countByProductId(storeId: string, productId: string): Promise<number>;
  create(input: CreateProductVariantRecordInput): Promise<ProductVariantRecord>;
  update(
    storeId: string,
    productId: string,
    id: string,
    input: UpdateProductVariantInput,
  ): Promise<ProductVariantRecord>;
  softDelete(
    storeId: string,
    productId: string,
    id: string,
  ): Promise<ProductVariantRecord>;
}
