"use client";

import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

interface TopNavProps {
  readonly sidebarOpen: boolean;
  readonly onToggleSidebar: () => void;
}

export function TopNav({ sidebarOpen, onToggleSidebar }: TopNavProps) {
  const { user, storeName, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? `${user.user.firstName} ${user.user.lastName}`.trim() || user.user.email
    : "User";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-white px-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
        <div>
          <p className="text-sm font-semibold tracking-tight">CommerceFlow</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {storeName}
          </p>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-muted)]"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-primary-foreground)]">
            {initials || "U"}
          </span>
          <span className="hidden text-sm font-medium sm:inline">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        </button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-48 rounded-md border border-[var(--color-border)] bg-white py-1 shadow-md"
          >
            <div className="border-b border-[var(--color-border)] px-3 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                {user?.user.email}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
