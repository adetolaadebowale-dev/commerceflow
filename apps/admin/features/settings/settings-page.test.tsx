import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsPage } from "@/features/settings/settings-page";
import type { AuthContextValue } from "@/providers/auth-provider";
import {
  getOrganization,
  getStoreSettings,
  listNotificationPreferences,
  updateStoreSettings,
} from "@/services/settings.service";
import { AdminApiError } from "@/types/api";

vi.mock("@/services/settings.service", () => ({
  getStoreSettings: vi.fn(),
  updateStoreSettings: vi.fn(),
  getOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  listOrganizationStores: vi.fn(),
  listNotificationPreferences: vi.fn(),
  updateNotificationPreference: vi.fn(),
}));

const useAuthMock = vi.fn<() => AuthContextValue>();
const toastMock = vi.fn();

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const storeId = "11111111-1111-1111-1111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";

const sampleStore = {
  id: storeId,
  organizationId,
  name: "CommerceFlow Store",
  slug: "commerceflow-store",
  settings: {
    defaultCurrency: "USD",
    defaultTimezone: "UTC",
    locale: "en-US",
  },
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
};

const sampleOrganization = {
  id: organizationId,
  name: "CommerceFlow Org",
  slug: "commerceflow-org",
  settings: {},
  createdAt: "2026-07-20T09:00:00.000Z",
  updatedAt: "2026-07-20T09:00:00.000Z",
};

function authValue(): AuthContextValue {
  return {
    user: {
      user: {
        id: "33333333-3333-4333-8333-333333333333",
        email: "admin@commerceflow.local",
        firstName: "Alex",
        lastName: "Admin",
        role: "admin",
      },
      permissions: [],
      session: {
        id: "44444444-4444-4444-8444-444444444444",
        userId: "33333333-3333-4333-8333-333333333333",
        expiresAt: "2026-07-20T12:00:00.000Z",
        createdAt: "2026-07-20T10:00:00.000Z",
        lastActiveAt: "2026-07-20T10:00:00.000Z",
      },
    },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    storeId,
    storeName: "CommerceFlow Store",
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders account, store, organization, and preferences", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(getStoreSettings).mockResolvedValue(sampleStore);
    vi.mocked(getOrganization).mockResolvedValue(sampleOrganization);
    vi.mocked(listNotificationPreferences).mockResolvedValue([
      {
        notificationType: "order_updates",
        emailEnabled: true,
        smsEnabled: false,
        inAppEnabled: true,
      },
    ]);

    renderPage();

    expect(await screen.findByText("Alex Admin")).toBeInTheDocument();
    expect(screen.getByText("admin@commerceflow.local")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("CommerceFlow Store")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("CommerceFlow Org")).toBeInTheDocument();
    expect(await screen.findByText("Order updates")).toBeInTheDocument();
  });

  it("saves store settings", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(getStoreSettings).mockResolvedValue(sampleStore);
    vi.mocked(getOrganization).mockResolvedValue(sampleOrganization);
    vi.mocked(listNotificationPreferences).mockResolvedValue([]);
    vi.mocked(updateStoreSettings).mockResolvedValue({
      ...sampleStore,
      name: "Updated Store",
    });

    renderPage();

    const nameInput = await screen.findByLabelText("Store name");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Store");
    await user.click(
      screen.getByRole("button", { name: "Save store settings" }),
    );

    await waitFor(() => {
      expect(updateStoreSettings).toHaveBeenCalledWith(
        storeId,
        expect.objectContaining({
          name: "Updated Store",
          slug: "commerceflow-store",
          defaultCurrency: "USD",
        }),
      );
    });
    expect(toastMock).toHaveBeenCalledWith("Store settings saved");
  });

  it("shows store settings error with retry", async () => {
    useAuthMock.mockReturnValue(authValue());
    vi.mocked(getStoreSettings).mockRejectedValue(
      new AdminApiError("FORBIDDEN", "Forbidden", 403),
    );
    vi.mocked(listNotificationPreferences).mockResolvedValue([]);

    renderPage();

    expect(
      await screen.findByText("Unable to load store settings"),
    ).toBeInTheDocument();
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });
});
