import type { ApiSuccessResponse } from "@/types/api";

export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  createdAt: string;
};

export type AuthStatus = {
  authenticated: boolean;
  user: AuthUser | null;
  onboardingCompleted: boolean;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
  onboardingCompleted: boolean;
};

export type RegisterResponse = {
  user: AuthUser;
  message: string;
};

export type AuthStatusApiResponse = ApiSuccessResponse<AuthStatus>;
export type AuthApiResponse = ApiSuccessResponse<AuthResponse>;
export type RegisterApiResponse = ApiSuccessResponse<RegisterResponse>;
