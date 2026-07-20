/** Shared admin UX copy for consistent empty / error messaging. */

export function storeNotConfiguredMessage(resource: string): string {
  return `Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to load ${resource}.`;
}

export function unableToLoadMessage(resource: string): string {
  return `Unable to load ${resource}.`;
}

export function unableToLoadTitle(resource: string): string {
  return `Unable to load ${resource}`;
}

/** Soft opacity while a list refetch keeps previous rows visible. */
export const LIST_REFETCH_CLASS =
  "opacity-70 transition-opacity duration-150" as const;
