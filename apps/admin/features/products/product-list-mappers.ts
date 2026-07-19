import type { Brand, Category, Product } from "@commerceflow/types";

import { formatCurrency, formatDateTime } from "@/lib/format";

export interface ProductListRow {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly category: string;
  readonly status: Product["status"];
  readonly price: string;
  readonly updatedAt: string;
}

export function formatProductPrice(product: Product): string {
  if (product.variants.length === 0) {
    return "—";
  }

  const amounts = product.variants.map((variant) =>
    Number.parseFloat(variant.price),
  );
  const currency = product.variants[0]?.currency ?? "USD";
  const valid = amounts.filter((amount) => !Number.isNaN(amount));

  if (valid.length === 0) {
    return "—";
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);

  if (min === max) {
    return formatCurrency(min, currency);
  }

  return `${formatCurrency(min, currency)} – ${formatCurrency(max, currency)}`;
}

export function mapProductToListRow(
  product: Product,
  brandsById: ReadonlyMap<string, Brand>,
  categoriesById: ReadonlyMap<string, Category>,
): ProductListRow {
  return {
    id: product.id,
    name: product.name,
    brand: product.brandId
      ? (brandsById.get(product.brandId)?.name ?? "Unknown brand")
      : "—",
    category:
      categoriesById.get(product.categoryId)?.name ?? "Unknown category",
    status: product.status,
    price: formatProductPrice(product),
    updatedAt: formatDateTime(product.updatedAt),
  };
}
