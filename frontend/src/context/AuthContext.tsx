/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCuratorAuthStatus,
  loginCuratorUserWithApple,
  loginCuratorUserWithGoogle,
  loginCuratorUser,
  logoutCuratorUser,
  registerCuratorUser,
  updateCuratorPassword,
  updateCuratorProfile,
} from "@/api/authApi";
import { setAuthToken } from "@/api/apiClient";
import { useSession } from "@/context/SessionContext";
import type {
  AuthUser,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from "@/types/auth";

const AUTH_TOKEN_KEY = "saarthi-auth-token";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  user: AuthUser | null;
  login: (payload: { identifier: string; password: string }) => Promise<boolean>;
  loginWithGoogle: (payload: { idToken?: string; code?: string }) => Promise<boolean>;
  loginWithApple: (payload: { idToken: string; name?: string }) => Promise<boolean>;
  register: (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  updatePassword: (payload: UpdatePasswordPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const { clearSession } = useSession();

  const refresh = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    setAuthToken(token);
    if (!token) {
      setUser(null);
      setOnboardingCompleted(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await getCuratorAuthStatus();
      setUser(response.data.user);
      setOnboardingCompleted(response.data.onboardingCompleted);
      if (!response.data.authenticated) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setAuthToken(null);
      }
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      setOnboardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const login = useCallback(async (payload: { identifier: string; password: string }) => {
    const response = await loginCuratorUser(payload);
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    setOnboardingCompleted(response.data.onboardingCompleted);
    return response.data.onboardingCompleted;
  }, []);

  const applyAuthResponse = useCallback((response: Awaited<ReturnType<typeof loginCuratorUser>>) => {
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    setOnboardingCompleted(response.data.onboardingCompleted);
    return response.data.onboardingCompleted;
  }, []);

  const loginWithGoogle = useCallback(
    async (payload: { idToken?: string; code?: string }) => {
      const response = await loginCuratorUserWithGoogle(payload);
      return applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const loginWithApple = useCallback(
    async (payload: { idToken: string; name?: string }) => {
      const response = await loginCuratorUserWithApple(payload);
      return applyAuthResponse(response);
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (payload: {
      name: string;
      username: string;
      email: string;
      password: string;
    }) => {
      await registerCuratorUser(payload);
    },
    []
  );

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const response = await updateCuratorProfile(payload);
    setUser(response.data.user);
    setOnboardingCompleted(response.data.onboardingCompleted);
  }, []);

  const updatePassword = useCallback(async (payload: UpdatePasswordPayload) => {
    const response = await updateCuratorPassword(payload);
    setUser(response.data.user);
    setOnboardingCompleted(response.data.onboardingCompleted);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutCuratorUser();
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      setOnboardingCompleted(false);
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      onboardingCompleted,
      user,
      login,
      loginWithApple,
      loginWithGoogle,
      register,
      logout,
      refresh,
      updatePassword,
      updateProfile,
    }),
    [
      isLoading,
      login,
      loginWithApple,
      loginWithGoogle,
      logout,
      onboardingCompleted,
      refresh,
      register,
      updatePassword,
      updateProfile,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
