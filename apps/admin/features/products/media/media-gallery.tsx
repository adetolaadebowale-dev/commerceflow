"use client";

import type { ProductMedia } from "@commerceflow/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaCard } from "@/features/products/media/media-card";

export interface MediaGalleryProps {
  readonly items: readonly ProductMedia[];
  readonly isLoading?: boolean;
  readonly onReorder: (orderedMediaIds: string[]) => void;
  readonly onDelete: (mediaId: string) => Promise<void>;
  readonly isDeleting?: boolean;
  readonly reorderDisabled?: boolean;
}

export function MediaGallery({
  items,
  isLoading = false,
  onReorder,
  onDelete,
  isDeleting = false,
  reorderDisabled = false,
}: MediaGalleryProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductMedia | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading media">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No media yet"
        description="Upload product images to build the gallery. Drag cards to reorder after upload."
      />
    );
  }

  function moveItem(from: number, to: number) {
    if (from === to || reorderDisabled) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      return;
    }
    next.splice(to, 0, moved);
    onReorder(next.map((item) => item.id));
  }

  return (
    <>
      <ul className="space-y-3" aria-label="Product media gallery">
        {items.map((media, index) => (
          <li key={media.id}>
            <MediaCard
              media={media}
              isDragging={dragIndex === index}
              dragOver={overIndex === index && dragIndex !== index}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              reorderDisabled={reorderDisabled}
              onDragStart={() => setDragIndex(index)}
              onDragOver={() => setOverIndex(index)}
              onDrop={() => {
                if (dragIndex != null) {
                  moveItem(dragIndex, index);
                }
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onMoveUp={() => moveItem(index, index - 1)}
              onMoveDown={() => moveItem(index, index + 1)}
              onDelete={() => setPendingDelete(media)}
              deleteDisabled={isDeleting || isConfirming}
            />
          </li>
        ))}
      </ul>

      <Modal
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open && !isConfirming) {
            setPendingDelete(null);
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete media</ModalTitle>
            <ModalDescription>
              Delete{" "}
              <span className="font-medium text-[var(--color-foreground)]">
                {pendingDelete?.originalFilename}
              </span>
              ? This cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isConfirming}
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isConfirming}
              onClick={() => {
                if (!pendingDelete) {
                  return;
                }
                setIsConfirming(true);
                void onDelete(pendingDelete.id)
                  .then(() => setPendingDelete(null))
                  .finally(() => setIsConfirming(false));
              }}
            >
              {isConfirming ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
