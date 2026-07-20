"use client";

import { Input } from "@/components/ui/input";
import type { BrandListFilters } from "@/features/brands/use-brands";

interface BrandListToolbarProps {
  readonly filters: BrandListFilters;
  readonly onSearchChange: (value: string) => void;
}

export function BrandListToolbar({
  filters,
  onSearchChange,
}: BrandListToolbarProps) {
  return (
    <Input
      value={filters.search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Search brands by name or slug…"
      aria-label="Search brands"
    />
  );
}
