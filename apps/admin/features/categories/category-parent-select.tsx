"use client";

import type { Category } from "@commerceflow/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CategoryParentSelectProps {
  readonly id?: string;
  readonly value: string;
  readonly categories: readonly Category[];
  /** Exclude this category (and typically itself when editing). */
  readonly excludeCategoryId?: string | null;
  readonly disabled?: boolean;
  readonly "aria-invalid"?: boolean;
  readonly onValueChange: (value: string) => void;
}

export function CategoryParentSelect({
  id = "category-parent",
  value,
  categories,
  excludeCategoryId,
  disabled = false,
  "aria-invalid": ariaInvalid,
  onValueChange,
}: CategoryParentSelectProps) {
  const options = categories.filter(
    (category) => category.id !== excludeCategoryId,
  );

  return (
    <Select
      value={value || "none"}
      onValueChange={(next) => onValueChange(next === "none" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label="Parent category"
        aria-invalid={ariaInvalid ? "true" : "false"}
      >
        <SelectValue placeholder="No parent (top-level)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No parent (top-level)</SelectItem>
        {options.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
