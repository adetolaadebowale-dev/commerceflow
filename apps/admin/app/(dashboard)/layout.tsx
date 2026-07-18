"use client";

import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProtectedRoute } from "@/features/auth/protected-route";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
