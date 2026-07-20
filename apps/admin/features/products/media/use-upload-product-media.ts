"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { productMediaQueryKey } from "@/features/products/media/media-query-keys";
import { uploadProductMedia } from "@/services/products.service";
import { AdminApiError } from "@/types/api";

export interface UploadQueueItem {
  readonly id: string;
  readonly file: File;
  readonly altText?: string;
  readonly progress: number;
  readonly status: "queued" | "uploading" | "success" | "error";
  readonly errorMessage?: string;
}

export function useUploadProductMedia(
  storeId: string | null,
  productId: string,
) {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  const updateItem = useCallback(
    (id: string, patch: Partial<UploadQueueItem>) => {
      setQueue((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const mutation = useMutation({
    mutationFn: async (input: {
      readonly file: File;
      readonly altText?: string;
      readonly queueId: string;
    }) => {
      if (!storeId) {
        throw new Error("Store id is required");
      }

      updateItem(input.queueId, { status: "uploading", progress: 0 });

      return uploadProductMedia(
        productId,
        {
          file: input.file,
          filename: input.file.name,
          altText: input.altText,
        },
        { storeId },
        {
          onProgress: (percent) => {
            updateItem(input.queueId, { progress: percent });
          },
        },
      );
    },
    onSuccess: async (_media, variables) => {
      updateItem(variables.queueId, { status: "success", progress: 100 });
      if (storeId) {
        await queryClient.invalidateQueries({
          queryKey: productMediaQueryKey(storeId, productId),
        });
      }
    },
    onError: (error, variables) => {
      updateItem(variables.queueId, {
        status: "error",
        errorMessage:
          error instanceof AdminApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Upload failed",
      });
    },
  });

  const uploadFiles = useCallback(
    async (
      files: readonly File[],
      altText?: string,
    ): Promise<{ readonly succeeded: number; readonly failed: number }> => {
      const items: UploadQueueItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        altText,
        progress: 0,
        status: "queued" as const,
      }));

      setQueue((current) => [...current, ...items]);

      let succeeded = 0;
      let failed = 0;

      for (const item of items) {
        try {
          await mutation.mutateAsync({
            file: item.file,
            altText: item.altText,
            queueId: item.id,
          });
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }

      return { succeeded, failed };
    },
    [mutation],
  );

  const clearFinished = useCallback(() => {
    setQueue((current) =>
      current.filter(
        (item) => item.status === "queued" || item.status === "uploading",
      ),
    );
  }, []);

  const retryItem = useCallback(
    async (queueId: string) => {
      const item = queue.find((entry) => entry.id === queueId);
      if (!item) {
        return;
      }
      updateItem(queueId, {
        status: "queued",
        progress: 0,
        errorMessage: undefined,
      });
      await mutation.mutateAsync({
        file: item.file,
        altText: item.altText,
        queueId: item.id,
      });
    },
    [mutation, queue, updateItem],
  );

  return {
    queue,
    uploadFiles,
    clearFinished,
    retryItem,
    isUploading: mutation.isPending,
  };
}
