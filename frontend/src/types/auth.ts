import type { ApiSuccessResponse } from "@/types/api";

export type AuthUser = {
  id: number;
  name: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
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

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type AuthStatusApiResponse = ApiSuccessResponse<AuthStatus>;
export type AuthApiResponse = ApiSuccessResponse<AuthResponse>;
export type RegisterApiResponse = ApiSuccessResponse<RegisterResponse>;
