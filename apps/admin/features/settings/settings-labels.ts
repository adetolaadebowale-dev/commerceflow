import type { NotificationPreferenceType } from "@commerceflow/types";

export const NOTIFICATION_TYPE_LABELS: Record<
  NotificationPreferenceType,
  string
> = {
  order_updates: "Order updates",
  payment_updates: "Payment updates",
  shipment_updates: "Shipment updates",
  return_updates: "Return updates",
  procurement_updates: "Procurement updates",
};

export function formatRoleLabel(role: string): string {
  if (!role.trim()) {
    return "—";
  }
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export function formatPersonName(
  firstName: string,
  lastName: string,
  fallbackEmail: string,
): string {
  const name = `${firstName} ${lastName}`.trim();
  return name.length > 0 ? name : fallbackEmail;
}
