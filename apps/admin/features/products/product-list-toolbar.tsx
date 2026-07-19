"use client";

import { PRODUCT_STATUSES } from "@commerceflow/types";
import type { Brand, Category } from "@commerceflow/types";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductListFilters } from "@/features/products/use-product-list";

interface ProductListToolbarProps {
  readonly filters: ProductListFilters;
  readonly brands: readonly Brand[];
  readonly categories: readonly Category[];
  readonly onSearchChange: (value: string) => void;
  readonly onStatusChange: (value: ProductListFilters["status"]) => void;
  readonly onBrandChange: (value: ProductListFilters["brandId"]) => void;
  readonly onCategoryChange: (value: ProductListFilters["categoryId"]) => void;
}

export function ProductListToolbar({
  filters,
  brands,
  categories,
  onSearchChange,
  onStatusChange,
  onBrandChange,
  onCategoryChange,
}: ProductListToolbarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Input
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
      />

      <Select
        value={filters.status}
        onValueChange={(value) =>
          onStatusChange(value as ProductListFilters["status"])
        }
      >
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {PRODUCT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.brandId}
        onValueChange={(value) =>
          onBrandChange(value as ProductListFilters["brandId"])
        }
      >
        <SelectTrigger aria-label="Filter by brand">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All brands</SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId}
        onValueChange={(value) =>
          onCategoryChange(value as ProductListFilters["categoryId"])
        }
      >
        <SelectTrigger aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
