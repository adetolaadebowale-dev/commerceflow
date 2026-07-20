"use client";

import { Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadDropzoneProps {
  readonly disabled?: boolean;
  readonly accept: string;
  readonly multiple?: boolean;
  readonly onFilesSelected: (files: File[]) => void;
}

export function UploadDropzone({
  disabled = false,
  accept,
  multiple = true,
  onFilesSelected,
}: UploadDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      onFilesSelected(Array.from(fileList));
    },
    [onFilesSelected],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload product images"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/40 px-6 py-10 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        isDragging && "border-[var(--color-primary)] bg-[var(--color-muted)]",
        disabled && "pointer-events-none opacity-50",
      )}
      onKeyDown={(event) => {
        if (disabled) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!disabled) {
          handleFiles(event.dataTransfer.files);
        }
      }}
    >
      <Upload className="h-8 w-8 text-[var(--color-muted-foreground)]" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium">Drag and drop images here</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          JPEG, PNG, WebP, or GIF · max 5 MB each
        </p>
      </div>
      <div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
      </div>
    </div>
  );
}
