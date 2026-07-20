"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { VISIBLE_NAV_ITEMS } from "@/lib/navigation";

interface SidebarProps {
  readonly open: boolean;
  readonly onNavigate?: () => void;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  if (!pathname.startsWith(`${href}/`)) {
    return false;
  }

  // Avoid treating /dashboard as active for /dashboard/products/*
  const hasMoreSpecificMatch = VISIBLE_NAV_ITEMS.some(
    (item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  return !hasMoreSpecificMatch;
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
      <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
        {VISIBLE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                isActive
                  ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                  : "text-[var(--color-muted-foreground)]",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
