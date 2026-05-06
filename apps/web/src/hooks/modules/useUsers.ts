import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  createUser,
  fetchPermissions,
  fetchRoles,
  fetchUsers,
  resetUserPassword,
  updateRolePermissions,
  updateUser,
  type UserCreateInput,
  type UserListQuery,
  type UserUpdateInput,
} from "@/services/modules/users.service";
import type { PermissionKey } from "@/types/auth.types";

export function useUsers(query: UserListQuery) {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => fetchUsers(query),
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: queryKeys.users.roles,
    queryFn: fetchRoles,
  });
}

export function useUserPermissions() {
  return useQuery({
    queryKey: queryKeys.users.permissions,
    queryFn: fetchPermissions,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreateInput) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdateInput }) =>
      updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetUserPassword(id, password),
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: PermissionKey[] }) =>
      updateRolePermissions(roleId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.roles });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.permissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
    },
  });
}
