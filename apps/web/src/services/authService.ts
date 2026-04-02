import api from "./api";
import { ENDPOINTS } from "@/services/endpoints";
import type {
  AuthClaims,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  User,
  UserRole,
} from "@/types/auth";

const VALID_ROLES: UserRole[] = ["admin", "cashier"];

// ──────────────────────────────────────────────
// TOKEN HELPERS
// These read/write tokens from localStorage.
// localStorage persists across browser refreshes,
// so the user stays logged in until they log out.
// ──────────────────────────────────────────────

export const getAccessToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
};

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const getAuthClaims = (): AuthClaims | null => {
  const token = getAccessToken();
  if (!token) return null;

  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const rawRoles = payload.roles;
  const roles = Array.isArray(rawRoles)
    ? rawRoles.filter(
        (v): v is AuthClaims["roles"][number] =>
          typeof v === "string" && VALID_ROLES.includes(v as UserRole)
      )
    : [];

  const rawWarehouse = payload.warehouse_id;
  const warehouse_id = typeof rawWarehouse === "number" ? rawWarehouse : null;

  return { roles, warehouse_id };
};

/** Save tokens + user to localStorage after login/register */
const storeAuthData = (data: AuthResponse): void => {
  localStorage.setItem("access_token", data.tokens.access);
  localStorage.setItem("refresh_token", data.tokens.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));
};

/** Clear all auth data from localStorage */
const clearAuthData = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

// ──────────────────────────────────────────────
// AUTH API CALLS
// Each function calls a Django endpoint via our
// configured Axios instance (which auto-attaches
// the JWT token and handles token refresh).
// ──────────────────────────────────────────────

/**
 * Register a new user.
 * POST /api/auth/register/
 * Returns user data + JWT tokens.
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(ENDPOINTS.auth.register, data);
  storeAuthData(response.data);
  return response.data;
};

/**
 * Log in with email + password.
 * POST /api/auth/login/
 * Returns user data + JWT tokens.
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(ENDPOINTS.auth.login, credentials);
  storeAuthData(response.data);
  return response.data;
};

/**
 * Log out by blacklisting the refresh token on the server,
 * then clearing local storage.
 * POST /api/auth/logout/
 */
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Tell the backend to blacklist the refresh token
      // so it can never be used again
      await api.post(ENDPOINTS.auth.logout, { refresh: refreshToken });
    }
  } catch {
    // Even if the server call fails, we still clear local data
    // (e.g. if the token was already expired)
  } finally {
    clearAuthData();
  }
};

/**
 * Get the currently logged-in user's profile.
 * GET /api/auth/profile/
 * The access token is attached automatically by the interceptor.
 */
export const getProfile = async (): Promise<User> => {
  const response = await api.get<User>(ENDPOINTS.auth.profile);
  return response.data;
};

/**
 * Update the current user's profile.
 * PUT /api/auth/profile/
 */
export const updateProfile = async (
  data: Partial<User>
): Promise<User> => {
  const response = await api.put<User>(ENDPOINTS.auth.profile, data);
  // Update the stored user data
  localStorage.setItem("user", JSON.stringify(response.data));
  return response.data;
};

/**
 * Change the current user's password.
 * POST /api/auth/change-password/
 */
export const changePassword = async (
  data: ChangePasswordData
): Promise<void> => {
  await api.post(ENDPOINTS.auth.changePassword, data);
};

/**
 * Check if the user is currently authenticated.
 * Simply checks if an access token exists in localStorage.
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
