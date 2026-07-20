"use client";

import type {
  NotificationPreferenceType,
  NotificationPreferenceView,
} from "@commerceflow/types";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NOTIFICATION_TYPE_LABELS } from "@/features/settings/settings-labels";
import { SettingsSection } from "@/features/settings/settings-section";
import { useUpdateNotificationPreference } from "@/features/settings/use-update-notification-preference";
import { useToast } from "@/providers/toast-provider";
import { AdminApiError } from "@/types/api";

type ChannelDraft = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
};

export interface NotificationPreferencesFormProps {
  readonly storeId: string;
  readonly preferences: readonly NotificationPreferenceView[] | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage: string;
  readonly onRetry: () => void;
}

function toDraftMap(
  preferences: readonly NotificationPreferenceView[] | undefined,
): Record<NotificationPreferenceType, ChannelDraft> | null {
  if (!preferences) {
    return null;
  }
  const map = {} as Record<NotificationPreferenceType, ChannelDraft>;
  for (const preference of preferences) {
    map[preference.notificationType] = {
      emailEnabled: preference.emailEnabled,
      smsEnabled: preference.smsEnabled,
      inAppEnabled: preference.inAppEnabled,
    };
  }
  return map;
}

function draftsEqual(
  a: Record<NotificationPreferenceType, ChannelDraft> | null,
  b: readonly NotificationPreferenceView[] | undefined,
): boolean {
  if (!a || !b) {
    return true;
  }
  return b.every((preference) => {
    const draft = a[preference.notificationType];
    return (
      draft &&
      draft.emailEnabled === preference.emailEnabled &&
      draft.smsEnabled === preference.smsEnabled &&
      draft.inAppEnabled === preference.inAppEnabled
    );
  });
}

export function NotificationPreferencesForm({
  storeId,
  preferences,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: NotificationPreferencesFormProps) {
  const { toast } = useToast();
  const updateMutation = useUpdateNotificationPreference(storeId);
  const [drafts, setDrafts] = useState<Record<
    NotificationPreferenceType,
    ChannelDraft
  > | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(toDraftMap(preferences));
    setFormError(null);
  }, [preferences]);

  const isDirty = !draftsEqual(drafts, preferences);

  function updateChannel(
    type: NotificationPreferenceType,
    channel: keyof ChannelDraft,
    value: boolean,
  ) {
    setDrafts((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [type]: {
          ...current[type],
          [channel]: value,
        },
      };
    });
  }

  async function handleSave() {
    if (!drafts || !preferences) {
      return;
    }
    setFormError(null);

    const changed = preferences.filter((preference) => {
      const draft = drafts[preference.notificationType];
      return (
        draft.emailEnabled !== preference.emailEnabled ||
        draft.smsEnabled !== preference.smsEnabled ||
        draft.inAppEnabled !== preference.inAppEnabled
      );
    });

    if (changed.length === 0) {
      return;
    }

    try {
      for (const preference of changed) {
        const draft = drafts[preference.notificationType];
        await updateMutation.mutateAsync({
          type: preference.notificationType,
          ...draft,
        });
      }
      toast("Notification preferences saved");
    } catch (error) {
      const message =
        error instanceof AdminApiError
          ? error.message
          : "Unable to save notification preferences.";
      setFormError(message);
      toast(message, "error");
    }
  }

  return (
    <SettingsSection
      id="notification-preferences"
      title="Notification preferences"
      description="Channel preferences for this store. Changes apply to your account."
    >
      {isLoading ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-label="Loading notification preferences"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Unable to load preferences"
          message={errorMessage}
          action={
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          }
        />
      ) : !preferences || preferences.length === 0 || !drafts ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No notification preferences are available for this store.
        </p>
      ) : (
        <div className="space-y-4">
          {formError ? (
            <ErrorState title="Unable to save" message={formError} />
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">SMS</TableHead>
                <TableHead className="text-center">In-app</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preferences.map((preference) => {
                const type = preference.notificationType;
                const draft = drafts[type];
                return (
                  <TableRow key={type}>
                    <TableCell className="font-medium">
                      {NOTIFICATION_TYPE_LABELS[type]}
                    </TableCell>
                    {(
                      [
                        ["emailEnabled", "Email"],
                        ["smsEnabled", "SMS"],
                        ["inAppEnabled", "In-app"],
                      ] as const
                    ).map(([channel, label]) => (
                      <TableCell key={channel} className="text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[var(--color-border)]"
                          checked={draft[channel]}
                          disabled={updateMutation.isPending}
                          aria-label={`${NOTIFICATION_TYPE_LABELS[type]} ${label}`}
                          onChange={(event) =>
                            updateChannel(type, channel, event.target.checked)
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={updateMutation.isPending || !isDirty}
              aria-busy={updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              {updateMutation.isPending
                ? "Saving…"
                : "Save preferences"}
            </Button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
