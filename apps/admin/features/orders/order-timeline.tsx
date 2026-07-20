"use client";

import { formatDateTime } from "@/lib/format";
import {
  buildOrderTimeline,
  type TimelineEvent,
} from "@/features/orders/order-utils";
import type { Order } from "@commerceflow/types";
import { cn } from "@/lib/utils";

export interface OrderTimelineProps {
  readonly order: Order;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const events = buildOrderTimeline(order);

  return (
    <ol className="space-y-4" aria-label="Order status timeline">
      {events.map((event, index) => (
        <TimelineRow
          key={event.key}
          event={event}
          isLast={index === events.length - 1}
        />
      ))}
    </ol>
  );
}

function TimelineRow({
  event,
  isLast,
}: {
  readonly event: TimelineEvent;
  readonly isLast: boolean;
}) {
  return (
    <li className="relative flex gap-3">
      {!isLast ? (
        <span
          className="absolute left-[7px] top-4 h-[calc(100%-0.5rem)] w-px bg-[var(--color-border)]"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2",
          event.complete
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-background)]",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pb-1">
        <p className="text-sm font-medium">{event.label}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {event.at ? formatDateTime(event.at) : "Pending"}
        </p>
      </div>
    </li>
  );
}
