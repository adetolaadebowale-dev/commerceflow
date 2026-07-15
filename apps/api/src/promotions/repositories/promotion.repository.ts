import type {
  CatalogueListResult,
  Promotion,
} from "@commerceflow/types";
import type {
  CreatePromotionInput,
  ListPromotionsQuery,
  UpdatePromotionInput,
} from "@commerceflow/validation";

export interface PromotionRepository {
  findById(storeId: string, id: string): Promise<Promotion | null>;
  findActiveByCode(
    storeId: string,
    code: string,
    excludeId?: string,
  ): Promise<Promotion | null>;
  list(query: ListPromotionsQuery): Promise<CatalogueListResult<Promotion>>;
  create(input: CreatePromotionInput): Promise<Promotion>;
  update(
    storeId: string,
    id: string,
    input: UpdatePromotionInput,
  ): Promise<Promotion>;
  softDelete(storeId: string, id: string): Promise<Promotion>;
}
