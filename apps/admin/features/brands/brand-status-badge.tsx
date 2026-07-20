"use client";

/** Listed brands are non-deleted; soft-deleted brands are hidden by the API. */
export function BrandStatusBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
      Active
    </span>
  );
}
