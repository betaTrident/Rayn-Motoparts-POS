import {
  changePassword,
  getProfile,
  updateProfile,
} from "@/services/authService.service";
import type { User } from "@/types/auth.types";

export interface SettingsProfileUpdateInput {
  first_name: string;
  last_name: string;
  phone?: string | null;
}

export interface SettingsPasswordUpdateInput {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export async function fetchSettingsProfile(): Promise<User> {
  return getProfile();
}

export async function saveSettingsProfile(
  payload: SettingsProfileUpdateInput
): Promise<User> {
  return updateProfile(payload);
}

export async function saveSettingsPassword(
  payload: SettingsPasswordUpdateInput
): Promise<void> {
  return changePassword(payload);
}
