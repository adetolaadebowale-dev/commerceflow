import Link from "next/link";
import { Package, ShoppingCart, Users, Warehouse } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const QUICK_ACTIONS = [
  {
    label: "Add Product",
    href: "/dashboard/products/new",
    description: "Create a catalogue product",
    icon: Package,
  },
  {
    label: "Create Order",
    href: "/dashboard/orders",
    description: "Start a new customer order",
    icon: ShoppingCart,
  },
  {
    label: "Add Customer",
    href: "/customers",
    description: "Add a store customer profile",
    icon: Users,
  },
  {
    label: "View Inventory",
    href: "/inventory",
    description: "Review stock levels",
    icon: Warehouse,
  },
] as const;

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                asChild
                variant="outline"
                className="h-auto justify-start px-4 py-3"
              >
                <Link href={action.href}>
                  <span className="flex flex-col items-start gap-1 text-left">
                    <span className="flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <span className="text-xs font-normal text-[var(--color-muted-foreground)]">
                      {action.description}
                    </span>
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
