import { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useSettingsProfile,
  useUpdateSettingsPassword,
  useUpdateSettingsProfile,
} from "@/hooks/modules/useSettings";
import { queryKeys } from "@/services/query/queryKeys";
import * as settingsService from "@/services/modules/settings.service";

vi.mock("@/services/modules/settings.service", () => ({
  fetchSettingsProfile: vi.fn(),
  saveSettingsProfile: vi.fn(),
  saveSettingsPassword: vi.fn(),
}));

function createWrapperWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe("settings hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads settings profile", async () => {
    const profile = {
      id: 10,
      email: "owner@example.com",
      username: "owner",
      first_name: "Site",
      last_name: "Owner",
      is_active: true,
      is_staff: true,
      date_joined: "2024-01-01T00:00:00Z",
    };

    vi.mocked(settingsService.fetchSettingsProfile).mockResolvedValue(profile as never);

    const { wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(settingsService.fetchSettingsProfile).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(profile);
  });

  it("updates settings and auth caches after profile mutation", async () => {
    const updatedProfile = {
      id: 10,
      email: "owner@example.com",
      username: "owner",
      first_name: "Updated",
      last_name: "Owner",
      is_active: true,
      is_staff: true,
      date_joined: "2024-01-01T00:00:00Z",
    };

    vi.mocked(settingsService.saveSettingsProfile).mockResolvedValue(updatedProfile as never);

    const { queryClient, wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useUpdateSettingsProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        first_name: "Updated",
        last_name: "Owner",
      });
    });

    expect(queryClient.getQueryData(queryKeys.settings.profile)).toEqual(updatedProfile);
    expect(queryClient.getQueryData(queryKeys.auth.user)).toEqual(updatedProfile);
  });

  it("calls password mutation service", async () => {
    vi.mocked(settingsService.saveSettingsPassword).mockResolvedValue();

    const { wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useUpdateSettingsPassword(), { wrapper });

    const payload = {
      old_password: "old-pass",
      new_password: "new-pass",
      new_password_confirm: "new-pass",
    };

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(settingsService.saveSettingsPassword).toHaveBeenCalledWith(payload);
  });
});
