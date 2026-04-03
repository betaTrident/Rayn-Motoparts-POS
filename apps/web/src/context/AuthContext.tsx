import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  User,
  UserRole,
  AuthClaims,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "@/types/auth.types";
import * as authService from "@/services/authService.service";

// ──────────────────────────────────────────────
// 1. DEFINE THE CONTEXT SHAPE
// ──────────────────────────────────────────────
interface AuthContextType {
  /** The currently logged-in user, or null */
  user: User | null;
  /** True while verifying the user's session on app load */
  isLoading: boolean;
  /** True if a user is authenticated */
  isAuthenticated: boolean;
  /** The underlying React Query result (for advanced use) */
  userQuery: UseQueryResult<User, Error>;
  /** Roles from JWT claims */
  roles: UserRole[];
  /** Full parsed auth claims if available */
  claims: AuthClaims | null;
  /** Check if user has any of the provided roles */
  hasAnyRole: (requiredRoles: UserRole[]) => boolean;
  /** Log in — returns the auth response */
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  /** Register — returns the auth response */
  register: (data: RegisterData) => Promise<AuthResponse>;
  /** Log out — clears tokens + user state */
  logout: () => Promise<void>;
}

// ──────────────────────────────────────────────
// 2. CREATE THE CONTEXT
// ──────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Query key constant — used to cache & invalidate user data
const USER_QUERY_KEY = ["auth", "user"] as const;

// ──────────────────────────────────────────────
// 3. THE PROVIDER COMPONENT
//
// WHAT CHANGED WITH REACT QUERY:
// Before: we used useState + useEffect to fetch the user
//         and manually tracked loading/error states.
// Now:    useQuery handles fetching, caching, loading &
//         error states automatically. useMutation handles
//         login/register/logout and invalidates the cache
//         so the user query re-fetches automatically.
// ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // ── Fetch current user on app load ──
  // This replaces the old useEffect + useState approach.
  // `enabled`: only run if we have tokens in localStorage.
  // `retry: false`: don't retry if the token is invalid.
  // `staleTime`: keep the user data fresh for 5 minutes
  //   before re-fetching in the background.
  const userQuery = useQuery<User, Error>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      return await authService.getProfile();
    },
    enabled: authService.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // ── Login mutation ──
  // useMutation wraps an async action and gives you
  // loading/error/success states + callbacks.
  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Put the user directly into the query cache
      // so we don't need an extra network request.
      queryClient.setQueryData(USER_QUERY_KEY, data.user);
    },
  });

  // ── Register mutation ──
  const registerMutation = useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: authService.register,
    onSuccess: (data) => {
      queryClient.setQueryData(USER_QUERY_KEY, data.user);
    },
  });

  // ── Logout mutation ──
  const logoutMutation = useMutation<void, Error>({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear the user from the cache
      queryClient.setQueryData(USER_QUERY_KEY, null);
      // Remove all cached queries (user data, etc.)
      queryClient.clear();
    },
  });

  // Wrap mutations in stable callbacks for consumers
  const login = useCallback(
    (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    [loginMutation]
  );

  const register = useCallback(
    (data: RegisterData) => registerMutation.mutateAsync(data),
    [registerMutation]
  );

  const logout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation]
  );

  const claims = useMemo(() => authService.getAuthClaims(), [userQuery.data]);
  const roles = claims?.roles ?? [];

  const hasAnyRole = useCallback(
    (requiredRoles: UserRole[]) => {
      if (!requiredRoles.length) {
        return true;
      }
      return requiredRoles.some((role) => roles.includes(role));
    },
    [roles]
  );

  const value: AuthContextType = {
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data,
    userQuery,
    roles,
    claims,
    hasAnyRole,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ──────────────────────────────────────────────
// 4. THE HOOK
// ──────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
