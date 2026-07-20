import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VariantList } from "@/features/products/variants/variant-list";

describe("VariantList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty state and opens create dialog", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <VariantList
          items={[]}
          onCreate={onCreate}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("No variants yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add variant" }));
    expect(
      await screen.findByRole("heading", { name: "Create variant" }),
    ).toBeInTheDocument();
  });

  it("lists variants and confirms delete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <VariantList
        items={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            productId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            sku: "TEE-S",
            name: "Size: S",
            price: "19.00",
            currency: "USD",
            attributes: { Size: "S" },
            createdAt: "2026-07-19T12:00:00.000Z",
            updatedAt: "2026-07-19T12:00:00.000Z",
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            productId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            sku: "TEE-M",
            name: "Size: M",
            price: "21.00",
            currency: "USD",
            attributes: { Size: "M" },
            createdAt: "2026-07-19T12:00:00.000Z",
            updatedAt: "2026-07-19T12:00:00.000Z",
          },
        ]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("TEE-S")).toBeInTheDocument();
    expect(screen.getByText("TEE-M")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Delete variant" }),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111111",
      );
    });
  });
});
