import {
  BarChart3,
  Building2,
  LayoutDashboard,
  Package,
  Server,
  ShoppingCart,
  Tags,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly enabled: boolean;
  readonly icon: LucideIcon;
}

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
  { label: "Categories", href: "/categories", enabled: false, icon: Tags },
  {
    label: "Warehouses",
    href: "/dashboard/warehouses",
    enabled: true,
    icon: Building2,
  },
  { label: "Inventory", href: "/inventory", enabled: true, icon: Warehouse },
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
  { label: "Reports", href: "/reports", enabled: false, icon: BarChart3 },
  { label: "Platform", href: "/platform", enabled: false, icon: Server },
];
