"use client";

import {
  PRODUCT_MEDIA_MAX_BYTES,
  PRODUCT_MEDIA_MIME_TYPES,
} from "@commerceflow/types";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadDropzone } from "@/features/products/media/upload-dropzone";
import type { UploadQueueItem } from "@/features/products/media/use-upload-product-media";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

const ACCEPT = PRODUCT_MEDIA_MIME_TYPES.join(",");

export interface MediaUploadProps {
  readonly disabled?: boolean;
  readonly queue: readonly UploadQueueItem[];
  readonly onUpload: (
    files: File[],
    altText?: string,
  ) => Promise<{ readonly succeeded: number; readonly failed: number } | void>;
  readonly onRetry: (queueId: string) => Promise<void>;
  readonly onClearFinished: () => void;
}

function validateFiles(files: readonly File[]): {
  readonly accepted: File[];
  readonly errors: string[];
} {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (
      !(PRODUCT_MEDIA_MIME_TYPES as readonly string[]).includes(file.type)
    ) {
      errors.push(`${file.name}: unsupported type (${file.type || "unknown"})`);
      continue;
    }
    if (file.size <= 0) {
      errors.push(`${file.name}: file is empty`);
      continue;
    }
    if (file.size > PRODUCT_MEDIA_MAX_BYTES) {
      errors.push(
        `${file.name}: exceeds ${formatFileSize(PRODUCT_MEDIA_MAX_BYTES)}`,
      );
      continue;
    }
    accepted.push(file);
  }

  return { accepted, errors };
}

export function MediaUpload({
  disabled = false,
  queue,
  onUpload,
  onRetry,
  onClearFinished,
}: MediaUploadProps) {
  const [altText, setAltText] = useState("");
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFiles(files: File[]) {
    const { accepted, errors } = validateFiles(files);
    setClientErrors(errors);
    if (accepted.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpload(accepted, altText.trim() || undefined);
      setAltText("");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasFinished = queue.some(
    (item) => item.status === "success" || item.status === "error",
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="media-upload-alt"
          className="text-sm font-medium"
        >
          Alt text for this upload batch (optional)
        </label>
        <Input
          id="media-upload-alt"
          value={altText}
          maxLength={500}
          disabled={disabled || isSubmitting}
          placeholder="Describe the images for accessibility"
          onChange={(event) => setAltText(event.target.value)}
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Applied to each file in the batch. Alt text cannot be edited after
          upload yet (backend gap).
        </p>
      </div>

      <UploadDropzone
        disabled={disabled || isSubmitting}
        accept={ACCEPT}
        multiple
        onFilesSelected={handleFiles}
      />

      {clientErrors.length > 0 ? (
        <ul className="space-y-1 text-sm text-[var(--color-destructive)]" role="alert">
          {clientErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {queue.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Upload progress</p>
            {hasFinished ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFinished}
              >
                Clear finished
              </Button>
            ) : null}
          </div>
          <ul className="space-y-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-[var(--color-border)] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm">{item.file.name}</p>
                  <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
                    {item.status === "success"
                      ? "Done"
                      : item.status === "error"
                        ? "Failed"
                        : `${item.progress}%`}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.progress}
                  aria-label={`Upload progress for ${item.file.name}`}
                >
                  <div
                    className={cn(
                      "h-full transition-all",
                      item.status === "error"
                        ? "bg-[var(--color-destructive)]"
                        : "bg-[var(--color-primary)]",
                    )}
                    style={{
                      width: `${item.status === "error" ? 100 : item.progress}%`,
                    }}
                  />
                </div>
                {item.status === "error" ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-[var(--color-destructive)]">
                      {item.errorMessage ?? "Upload failed"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void onRetry(item.id)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
