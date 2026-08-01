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
  loginCuratorUser,
  logoutCuratorUser,
  registerCuratorUser,
} from "@/api/authApi";
import { setAuthToken } from "@/api/apiClient";
import type { AuthUser } from "@/types/auth";

const AUTH_TOKEN_KEY = "saarthi-auth-token";

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  user: AuthUser | null;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

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

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const response = await loginCuratorUser(payload);
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    setAuthToken(response.data.token);
    setUser(response.data.user);
    setOnboardingCompleted(response.data.onboardingCompleted);
    return response.data.onboardingCompleted;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      await registerCuratorUser(payload);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutCuratorUser();
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
      setOnboardingCompleted(false);
      sessionStorage.removeItem("ai-learning-agent-session");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      onboardingCompleted,
      user,
      login,
      register,
      logout,
      refresh,
    }),
    [isLoading, login, logout, onboardingCompleted, refresh, register, user]
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
