"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaGallery } from "@/features/products/media/media-gallery";
import { MediaUpload } from "@/features/products/media/media-upload";
import { useDeleteProductMedia } from "@/features/products/media/use-delete-product-media";
import { useProductMedia } from "@/features/products/media/use-product-media";
import { useReorderProductMedia } from "@/features/products/media/use-reorder-product-media";
import { useUploadProductMedia } from "@/features/products/media/use-upload-product-media";
import { ProductEditForm } from "@/features/products/product-edit-form";
import { useProduct } from "@/features/products/use-product";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { AdminApiError } from "@/types/api";

export function ProductDetail({ productId }: { readonly productId: string }) {
  const router = useRouter();
  const { storeId } = useAuth();
  const { toast } = useToast();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsFormDirty(dirty);
  }, []);

  const detail = useProduct(storeId, productId);
  const mediaQuery = useProductMedia(storeId, productId);
  const upload = useUploadProductMedia(storeId, productId);
  const deleteMutation = useDeleteProductMedia(storeId, productId);
  const reorderMutation = useReorderProductMedia(storeId, productId);

  function confirmLeave(): boolean {
    if (!isFormDirty) {
      return true;
    }
    return window.confirm("You have unsaved changes. Leave without saving?");
  }

  function handleBackToProducts() {
    if (!confirmLeave()) {
      return;
    }
    router.push("/dashboard/products");
  }

  if (!storeId) {
    return (
      <ErrorState
        title="Store not configured"
        message="Set NEXT_PUBLIC_DEFAULT_STORE_ID to a valid store UUID to load this product."
      />
    );
  }

  if (detail.isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detail.isError || !detail.product) {
    const message =
      detail.error instanceof AdminApiError
        ? detail.error.message
        : "Unable to load this product.";

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <ErrorState title="Product not found" message={message} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => detail.refetch()}>
            Retry
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/products">Back to products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const product = detail.product;
  const mediaError =
    mediaQuery.error instanceof AdminApiError
      ? mediaQuery.error.message
      : "Unable to load product media.";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <button
              type="button"
              className="underline-offset-4 hover:underline"
              onClick={handleBackToProducts}
            >
              Products
            </button>
            <span aria-hidden> / </span>
            <span>{product.name}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Edit product details and manage media on one page
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleBackToProducts}>
          Back to products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Product Information
          </CardTitle>
          <CardDescription>
            Update name, description, slug, brand, category, and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {detail.isFiltersError ? (
            <ErrorState
              title="Unable to load form options"
              message="Brand and category lists could not be loaded. Retry the page."
            />
          ) : (
            <ProductEditForm
              product={product}
              storeId={storeId}
              brands={detail.brands}
              categories={detail.categories}
              onDirtyChange={handleDirtyChange}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Media Gallery</CardTitle>
          <CardDescription>
            Upload, reorder, and delete product images. Drag cards to change
            gallery order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <MediaUpload
            queue={upload.queue}
            onUpload={async (files, altText) => {
              const result = await upload.uploadFiles(files, altText);
              if (result.succeeded > 0 && result.failed === 0) {
                toast(
                  result.succeeded === 1
                    ? "Image uploaded"
                    : `${result.succeeded} images uploaded`,
                );
              } else if (result.succeeded > 0) {
                toast(
                  `${result.succeeded} uploaded, ${result.failed} failed`,
                  "error",
                );
              } else {
                toast("Upload failed", "error");
              }
              return result;
            }}
            onRetry={async (queueId) => {
              try {
                await upload.retryItem(queueId);
                toast("Image uploaded");
              } catch {
                toast("Retry failed", "error");
              }
            }}
            onClearFinished={upload.clearFinished}
          />

          {mediaQuery.isError ? (
            <div className="space-y-3">
              <ErrorState title="Unable to load media" message={mediaError} />
              <Button
                type="button"
                variant="outline"
                onClick={() => mediaQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <MediaGallery
              items={mediaQuery.data?.items ?? []}
              isLoading={mediaQuery.isLoading}
              isDeleting={deleteMutation.isPending}
              reorderDisabled={reorderMutation.isPending}
              onReorder={(orderedMediaIds) => {
                reorderMutation.mutate(orderedMediaIds, {
                  onError: (error) => {
                    toast(
                      error instanceof AdminApiError
                        ? error.message
                        : "Reorder failed; order restored",
                      "error",
                    );
                  },
                });
              }}
              onDelete={async (mediaId) => {
                try {
                  await deleteMutation.mutateAsync(mediaId);
                  toast("Media deleted");
                } catch (error) {
                  toast(
                    error instanceof AdminApiError
                      ? error.message
                      : "Delete failed",
                    "error",
                  );
                  throw error;
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
