import { redirect } from "next/navigation";

/**
 * Standalone inventory admin is not ready. Inventory is managed on product detail.
 * Keep this route so old bookmarks do not 404.
 */
export default function InventoryPage() {
  redirect("/dashboard/products");
}
