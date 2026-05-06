import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";
import type { PermissionKey, UserRole } from "@/types/auth.types";

export interface UserListQuery {
  q?: string;
  role?: "all" | "admin" | "staff";
  active?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface ManagedUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  role: UserRole | null;
  permissions: PermissionKey[];
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
  date_joined: string;
  updated_at: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  staff: number;
}

export interface UserListResponse {
  results: ManagedUser[];
  stats: UserStats;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export interface UserCreateInput {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: "admin" | "staff";
  password: string;
  is_active?: boolean;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string | null;
  role?: "admin" | "staff";
  is_active?: boolean;
}

export interface PermissionDefinition {
  id: number;
  key: PermissionKey;
  module: string;
  action: string;
  description: string | null;
}

export interface PermissionListResponse {
  results: PermissionDefinition[];
  grouped: Record<string, PermissionDefinition[]>;
}

export interface RolePreset {
  id: number;
  name: UserRole;
  description: string | null;
  is_active: boolean;
  permissions: PermissionKey[];
  user_count: number;
}

export interface RoleListResponse {
  results: RolePreset[];
}

function toParams(query: UserListQuery) {
  const params: Record<string, string> = {};
  if (query.q) params.q = query.q;
  if (query.role && query.role !== "all") params.role = query.role;
  if (query.active && query.active !== "all") {
    params.active = query.active === "active" ? "true" : "false";
  }
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.page_size = String(query.pageSize);
  return params;
}

export async function fetchUsers(query: UserListQuery = {}): Promise<UserListResponse> {
  const { data } = await api.get<UserListResponse>(ENDPOINTS.auth.users, {
    params: toParams(query),
  });
  return data;
}

export async function createUser(payload: UserCreateInput): Promise<ManagedUser> {
  const { data } = await api.post<ManagedUser>(ENDPOINTS.auth.users, payload);
  return data;
}

export async function updateUser(id: number, payload: UserUpdateInput): Promise<ManagedUser> {
  const { data } = await api.patch<ManagedUser>(ENDPOINTS.auth.userById(id), payload);
  return data;
}

export async function resetUserPassword(id: number, password: string): Promise<void> {
  await api.post(ENDPOINTS.auth.resetUserPassword(id), { password });
}

export async function fetchRoles(): Promise<RoleListResponse> {
  const { data } = await api.get<RoleListResponse>(ENDPOINTS.auth.roles);
  return data;
}

export async function fetchPermissions(): Promise<PermissionListResponse> {
  const { data } = await api.get<PermissionListResponse>(ENDPOINTS.auth.permissions);
  return data;
}

export async function updateRolePermissions(
  roleId: number,
  permissions: PermissionKey[],
): Promise<RolePreset> {
  const { data } = await api.patch<RolePreset>(ENDPOINTS.auth.rolePermissions(roleId), {
    permissions,
  });
  return data;
}
