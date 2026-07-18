"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";

interface SidebarProps {
  readonly open: boolean;
  readonly onNavigate?: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r border-[var(--color-border)] bg-white transition-transform md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center border-b border-[var(--color-border)] px-4 md:hidden">
        <span className="text-sm font-semibold">Navigation</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.enabled &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));

          if (!item.enabled) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-muted-foreground)] opacity-50"
                aria-disabled="true"
                title="Coming in a later sprint"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)]",
                isActive
                  ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
