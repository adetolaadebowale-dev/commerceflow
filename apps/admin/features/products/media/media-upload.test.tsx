import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MediaUpload } from "@/features/products/media/media-upload";

describe("MediaUpload", () => {
  afterEach(() => {
    cleanup();
  });

  it("rejects unsupported files client-side", async () => {
    const onUpload = vi.fn();

    render(
      <MediaUpload
        queue={[]}
        onUpload={onUpload}
        onRetry={vi.fn()}
        onClearFinished={vi.fn()}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input missing");
    }

    const file = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    Object.defineProperty(input, "files", {
      configurable: true,
      value: {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
        [Symbol.iterator]: function* () {
          yield file;
        },
      },
    });
    fireEvent.change(input);

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/unsupported type/i);
  });

  it("forwards accepted images to onUpload", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn().mockResolvedValue({ succeeded: 1, failed: 0 });

    render(
      <MediaUpload
        queue={[]}
        onUpload={onUpload}
        onRetry={vi.fn()}
        onClearFinished={vi.fn()}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input missing");
    }

    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "a.png", {
      type: "image/png",
    });
    await user.upload(input, file);

    expect(onUpload).toHaveBeenCalledWith([file], undefined);
  });
});
