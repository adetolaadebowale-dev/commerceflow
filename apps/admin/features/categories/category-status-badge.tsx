"use client";

/**
 * Listed categories are active in catalogue.
 * Soft deactivate is not exposed by the Categories API.
 */
export function CategoryStatusBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
      Active
    </span>
  );
}
