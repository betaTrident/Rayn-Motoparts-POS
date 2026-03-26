import api from "./api";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  User,
} from "@/types/auth";

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
  const response = await api.post<AuthResponse>("auth/register/", data);
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
  const response = await api.post<AuthResponse>("auth/login/", credentials);
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
      await api.post("auth/logout/", { refresh: refreshToken });
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
  const response = await api.get<User>("auth/profile/");
  return response.data;
};

/**
 * Update the current user's profile.
 * PUT /api/auth/profile/
 */
export const updateProfile = async (
  data: Partial<User>
): Promise<User> => {
  const response = await api.put<User>("auth/profile/", data);
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
  await api.post("auth/change-password/", data);
};

/**
 * Check if the user is currently authenticated.
 * Simply checks if an access token exists in localStorage.
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
