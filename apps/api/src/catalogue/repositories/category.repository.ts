import type { Category, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "@commerceflow/validation";

export interface CategoryRepository {
  findById(storeId: string, id: string): Promise<Category | null>;
  findBySlug(storeId: string, slug: string): Promise<Category | null>;
  list(query: ListCategoriesQuery): Promise<CatalogueListResult<Category>>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(
    storeId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category>;
}
