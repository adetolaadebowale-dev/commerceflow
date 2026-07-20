"use client";

import { ChevronDown, ChevronUp, GripVertical, ImageOff, Trash2 } from "lucide-react";
import type { ProductMedia } from "@commerceflow/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatDateTime, formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface MediaCardProps {
  readonly media: ProductMedia;
  readonly isDragging?: boolean;
  readonly dragOver?: boolean;
  readonly canMoveUp?: boolean;
  readonly canMoveDown?: boolean;
  readonly onDragStart: () => void;
  readonly onDragOver: () => void;
  readonly onDrop: () => void;
  readonly onDragEnd: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onDelete: () => void;
  readonly deleteDisabled?: boolean;
  readonly reorderDisabled?: boolean;
}

export function MediaCard({
  media,
  isDragging = false,
  dragOver = false,
  canMoveUp = false,
  canMoveDown = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onDelete,
  deleteDisabled = false,
  reorderDisabled = false,
}: MediaCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimensions =
    media.width != null && media.height != null
      ? `${media.width} × ${media.height}`
      : "Dimensions unavailable";

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex gap-3 rounded-lg border border-[var(--color-border)] bg-white p-3 outline-none focus-within:ring-2 focus-within:ring-[var(--color-ring)]",
        isDragging && "opacity-50",
        dragOver && "border-[var(--color-primary)]",
      )}
      aria-label={`Media ${media.originalFilename}`}
    >
      <div
        className="flex shrink-0 cursor-grab items-center text-[var(--color-muted-foreground)] active:cursor-grabbing"
        aria-hidden
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]">
        {imageFailed ? (
          <ImageOff
            className="h-6 w-6 text-[var(--color-muted-foreground)]"
            aria-hidden
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.url}
            alt={media.altText || media.originalFilename}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium">{media.originalFilename}</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {dimensions} · {formatFileSize(media.sizeBytes)}
        </p>
        <p className="truncate text-xs text-[var(--color-muted-foreground)]">
          Alt text: {media.altText?.trim() ? media.altText : "—"}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Uploaded {formatDateTime(media.createdAt)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${media.originalFilename} up`}
          disabled={reorderDisabled || !canMoveUp}
          onClick={onMoveUp}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Move ${media.originalFilename} down`}
          disabled={reorderDisabled || !canMoveDown}
          onClick={onMoveDown}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Delete ${media.originalFilename}`}
          disabled={deleteDisabled}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
