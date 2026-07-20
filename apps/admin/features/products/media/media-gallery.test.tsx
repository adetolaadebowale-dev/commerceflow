import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductMedia } from "@commerceflow/types";

import { MediaGallery } from "@/features/products/media/media-gallery";

function media(overrides: Partial<ProductMedia> = {}): ProductMedia {
  const id = overrides.id ?? crypto.randomUUID();
  return {
    id,
    storeId: "11111111-1111-1111-1111-111111111111",
    productId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    storageKey: `stores/x/products/y/${id}.png`,
    url: `http://localhost/media/${id}.png`,
    originalFilename: overrides.originalFilename ?? "front.png",
    mimeType: "image/png",
    sizeBytes: 2048,
    width: 800,
    height: 600,
    altText: "Front view",
    sortOrder: 0,
    createdAt: "2026-07-19T12:00:00.000Z",
    updatedAt: "2026-07-19T12:00:00.000Z",
    ...overrides,
  };
}

describe("MediaGallery", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows empty state when there is no media", () => {
    render(
      <MediaGallery
        items={[]}
        onReorder={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("No media yet")).toBeInTheDocument();
  });

  it("renders media metadata and requests delete confirmation", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const item = media({ originalFilename: "hero.png" });

    render(
      <MediaGallery
        items={[item]}
        onReorder={vi.fn()}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("hero.png")).toBeInTheDocument();
    expect(screen.getByText(/800 × 600/)).toBeInTheDocument();
    expect(screen.getByText(/Alt text: Front view/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete hero.png" }));
    expect(screen.getByText("Delete media")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(item.id);
  });

  it("reorders with keyboard-accessible move buttons", async () => {
    const user = userEvent.setup();
    const onReorder = vi.fn();
    const first = media({ id: "11111111-1111-4111-8111-111111111111", originalFilename: "a.png", sortOrder: 0 });
    const second = media({ id: "22222222-2222-4222-8222-222222222222", originalFilename: "b.png", sortOrder: 1 });

    render(
      <MediaGallery
        items={[first, second]}
        onReorder={onReorder}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Move a.png down" }));
    expect(onReorder).toHaveBeenCalledWith([second.id, first.id]);
  });
});
