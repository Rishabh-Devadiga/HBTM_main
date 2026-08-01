import { apiClient, setAuthToken } from "@/api/apiClient";
import type {
  AuthApiResponse,
  AuthStatusApiResponse,
  RegisterApiResponse,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from "@/types/auth";

export async function registerCuratorUser(payload: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Promise<RegisterApiResponse> {
  const response = await apiClient.post<RegisterApiResponse>(
    "/curator/auth/register",
    payload
  );
  return response.data;
}

export async function loginCuratorUser(payload: {
  identifier: string;
  password: string;
}): Promise<AuthApiResponse> {
  const response = await apiClient.post<AuthApiResponse>(
    "/curator/auth/login",
    payload
  );
  return response.data;
}

export async function updateCuratorProfile(
  payload: UpdateProfilePayload
): Promise<AuthStatusApiResponse> {
  const response = await apiClient.patch<AuthStatusApiResponse>(
    "/curator/auth/profile",
    payload
  );
  return response.data;
}

export async function updateCuratorPassword(
  payload: UpdatePasswordPayload
): Promise<AuthStatusApiResponse> {
  const response = await apiClient.patch<AuthStatusApiResponse>(
    "/curator/auth/password",
    payload
  );
  return response.data;
}

export async function loginCuratorUserWithGoogle(payload: {
  idToken?: string;
  code?: string;
}): Promise<AuthApiResponse> {
  const response = await apiClient.post<AuthApiResponse>(
    "/curator/auth/google",
    payload
  );
  return response.data;
}

export async function loginCuratorUserWithApple(payload: {
  idToken: string;
  name?: string;
}): Promise<AuthApiResponse> {
  const response = await apiClient.post<AuthApiResponse>(
    "/curator/auth/apple",
    payload
  );
  return response.data;
}

export async function getCuratorAuthStatus(): Promise<AuthStatusApiResponse> {
  const response = await apiClient.get<AuthStatusApiResponse>("/curator/auth/me");
  return response.data;
}

export async function logoutCuratorUser(): Promise<AuthStatusApiResponse> {
  const response = await apiClient.post<AuthStatusApiResponse>(
    "/curator/auth/logout",
    {}
  );
  setAuthToken(null);
  return response.data;
}
