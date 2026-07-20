import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly enabled: boolean;
  readonly icon: LucideIcon;
}

/**
 * Admin primary navigation.
 * Only `enabled: true` items are shown in the sidebar.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    enabled: true,
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    enabled: true,
    icon: Package,
  },
  {
    label: "Warehouses",
    href: "/dashboard/warehouses",
    enabled: true,
    icon: Building2,
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    enabled: true,
    icon: ShoppingCart,
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    enabled: true,
    icon: Users,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    enabled: true,
    icon: BarChart3,
  },
];

/** Visible nav items only — use this for sidebar rendering. */
export const VISIBLE_NAV_ITEMS = NAV_ITEMS.filter((item) => item.enabled);
