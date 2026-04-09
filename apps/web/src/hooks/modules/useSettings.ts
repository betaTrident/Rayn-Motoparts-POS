import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  fetchSettingsProfile,
  saveSettingsPassword,
  saveSettingsProfile,
  type SettingsPasswordUpdateInput,
  type SettingsProfileUpdateInput,
} from "@/services/modules/settings.service";

export function useSettingsProfile() {
  return useQuery({
    queryKey: queryKeys.settings.profile,
    queryFn: fetchSettingsProfile,
  });
}

export function useUpdateSettingsProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsProfileUpdateInput) => saveSettingsProfile(payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(queryKeys.settings.profile, updatedUser);
      queryClient.setQueryData(queryKeys.auth.user, updatedUser);
    },
  });
}

export function useUpdateSettingsPassword() {
  return useMutation({
    mutationFn: (payload: SettingsPasswordUpdateInput) => saveSettingsPassword(payload),
  });
}
