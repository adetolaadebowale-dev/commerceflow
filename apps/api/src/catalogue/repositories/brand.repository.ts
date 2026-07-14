import type { Brand, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateBrandInput,
  ListBrandsQuery,
  UpdateBrandInput,
} from "@commerceflow/validation";

export interface BrandRepository {
  findById(storeId: string, id: string): Promise<Brand | null>;
  findBySlug(storeId: string, slug: string): Promise<Brand | null>;
  list(query: ListBrandsQuery): Promise<CatalogueListResult<Brand>>;
  create(input: CreateBrandInput): Promise<Brand>;
  update(
    storeId: string,
    id: string,
    input: UpdateBrandInput,
  ): Promise<Brand>;
  softDelete(storeId: string, id: string): Promise<Brand>;
}
