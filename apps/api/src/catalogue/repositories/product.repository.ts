import type { Product, CatalogueListResult } from "@commerceflow/types";
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from "@commerceflow/validation";

export interface ProductRepository {
  findById(storeId: string, id: string): Promise<Product | null>;
  findBySlug(storeId: string, slug: string): Promise<Product | null>;
  list(query: ListProductsQuery): Promise<CatalogueListResult<Product>>;
  create(input: CreateProductInput): Promise<Product>;
  update(
    storeId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product>;
  brandExists(storeId: string, id: string): Promise<boolean>;
}
