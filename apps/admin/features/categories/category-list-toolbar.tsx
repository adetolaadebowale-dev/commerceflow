"use client";

import { Input } from "@/components/ui/input";
import type { CategoryListFilters } from "@/features/categories/use-categories";

interface CategoryListToolbarProps {
  readonly filters: CategoryListFilters;
  readonly onSearchChange: (value: string) => void;
}

export function CategoryListToolbar({
  filters,
  onSearchChange,
}: CategoryListToolbarProps) {
  return (
    <Input
      value={filters.search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Search categories by name or slug…"
      aria-label="Search categories"
    />
  );
}
