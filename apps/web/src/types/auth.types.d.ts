// ──────────────────────────────────────────────
// What the backend RETURNS for a user
// ──────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  last_login_at?: string | null;
  deleted_at?: string | null;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export type UserRole =
  | "superadmin"
  | "admin"
  | "staff";

export interface AuthClaims {
  roles: UserRole[];
}

// ──────────────────────────────────────────────
// What we SEND to the backend
// ──────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// ──────────────────────────────────────────────
// What the backend RETURNS after login/register
// ──────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
