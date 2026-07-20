"use client";

import { SettingsSection } from "@/features/settings/settings-section";
import {
  formatPersonName,
  formatRoleLabel,
} from "@/features/settings/settings-labels";
import type { AuthenticatedSession } from "@/types/auth";

export interface AccountSummaryCardProps {
  readonly session: AuthenticatedSession | null;
  readonly storeId: string | null;
  readonly storeName: string;
}

export function AccountSummaryCard({
  session,
  storeId,
  storeName,
}: AccountSummaryCardProps) {
  const user = session?.user;

  return (
    <SettingsSection
      id="account-information"
      title="Account"
      description="Signed-in user and active store. Profile editing is not available yet."
    >
      {!user ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sign in to view account details.
        </p>
      ) : (
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Name</dt>
            <dd className="mt-1 font-medium">
              {formatPersonName(user.firstName, user.lastName, user.email)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Email</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Role</dt>
            <dd className="mt-1">{formatRoleLabel(user.role)}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">
              Current store
            </dt>
            <dd className="mt-1">
              <span className="font-medium">{storeName}</span>
              {storeId ? (
                <span className="mt-1 block font-mono text-xs text-[var(--color-muted-foreground)] break-all">
                  {storeId}
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      )}
    </SettingsSection>
  );
}
